import db from '../db.js';
import { createNotification, processMentions } from '../services/notificationService.js';
import { addPoints, deductPoints, getUserPointsAndRank, getRank } from '../services/pointsService.js';

export default async function forumRoutes(fastify, options) {
    // Get all topics (with pagination and optional search)
    fastify.get('/topics', async (request, reply) => {
        const { page = 1, limit = 10, search = '', sort = 'newest', filter = 'all' } = request.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT t.id, t.title, substr(t.content, 1, 200) as content, t.user_id, t.created_at, t.updated_at, t.views, t.is_pinned, t.is_featured, t.is_solved, t.bounty_points, t.view_permission_level, t.view_points_required,
            u.username, u.nickname, u.role, u.points,
            (SELECT COUNT(*) FROM comments c WHERE c.topic_id = t.id) as comment_count
            FROM topics t
            JOIN users u ON t.user_id = u.id
        `;
        let countQuery = 'SELECT COUNT(*) as count FROM topics t JOIN users u ON t.user_id = u.id';
        const params = [];
        const whereClauses = [];

        if (search) {
            whereClauses.push('(t.title LIKE ? OR t.content LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }
        
        if (filter === 'featured') {
            whereClauses.push('t.is_featured = 1');
        } else if (filter === 'paid') {
            whereClauses.push('t.view_points_required > 0');
        } else if (filter === 'free') {
            whereClauses.push('t.view_points_required = 0');
        } else if (filter === 'bounty') {
            whereClauses.push('t.bounty_points > 0');
        }

        if (whereClauses.length > 0) {
            const whereClause = ' WHERE ' + whereClauses.join(' AND ');
            query += whereClause;
            countQuery += whereClause;
        }

        // Sorting logic
        // Default: Pinned first, then by sort criteria
        let orderBy = ' ORDER BY t.is_pinned DESC';
        
        switch (sort) {
            case 'hottest': // Most views + comments? or just views? Let's use views for now, or a simple heuristic
                orderBy += ', t.views DESC, comment_count DESC';
                break;
            case 'replies':
                orderBy += ', comment_count DESC';
                break;
            case 'newest':
            default:
                orderBy += ', t.updated_at DESC';
                break;
        }
        
        query += orderBy + ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const topics = db.prepare(query).all(...params).map(t => {
            const rank = getRank(t.points || 0);
            return { ...t, rankLevel: rank.level };
        });
        // We need to run count query with ONLY search/filter params, not limit/offset
        // The params array currently has search params + limit + offset
        // We need to slice off the last 2 for the count query
        const countParams = params.slice(0, -2);
        const total = db.prepare(countQuery).get(...countParams).count;

        return {
            topics,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
        };
    });

    // Helper: Check Topic Access
    const checkTopicAccess = (user, topic) => {
        // Fetch fresh user if not provided or just ID
        // But user passed here is usually from request.user (decoded token)
        // We should fetch fresh role/rank info if possible, but for performance, maybe rely on caller?
        // Caller fastify.authenticate already verifies token.
        // But we learned token might be stale.
        
        let freshUser = user;
        // If user object doesn't have rankLevel, we might need to fetch it.
        // Actually, let's just fetch everything fresh if user exists.
        if (user && user.id) {
            const u = db.prepare('SELECT id, username, nickname, role FROM users WHERE id = ?').get(user.id);
            if (u) {
                const details = getUserPointsAndRank(u.id);
                freshUser = { ...u, ...details };
            } else {
                freshUser = null; // User deleted
            }
        } else {
            freshUser = null;
        }

        let accessDenied = false;
        let denyReason = '';

        // Check Rank Permission
        if (topic.view_permission_level > 0) {
             if (!freshUser) {
                 accessDenied = true;
                 denyReason = 'login_required';
             } else if ((freshUser.rankLevel || 0) < topic.view_permission_level && freshUser.role !== 'admin' && freshUser.role !== 'super_admin' && freshUser.id !== topic.user_id) {
                 accessDenied = true;
                 denyReason = 'rank_too_low';
             }
        }

        // Check Points/Purchase Permission
        let hasPurchased = false;
        if (topic.view_points_required > 0) {
            if (freshUser) {
                if (freshUser.id === topic.user_id || freshUser.role === 'admin' || freshUser.role === 'super_admin') {
                    hasPurchased = true;
                } else {
                    const purchase = db.prepare('SELECT 1 FROM topic_purchases WHERE user_id = ? AND topic_id = ?').get(freshUser.id, topic.id);
                    if (purchase) hasPurchased = true;
                }
            }

            if (!hasPurchased) {
                accessDenied = true;
                denyReason = freshUser ? 'purchaseRequired' : 'login_required';
            }
        }

        return { accessDenied, denyReason, user: freshUser, hasPurchased };
    };

    // Get single topic
    fastify.get('/topics/:id', async (request, reply) => {
        const id = parseInt(request.params.id);
        let user = null;

        // Try to get user from token if present
        try {
            if (request.headers.authorization) {
                await request.jwtVerify();
                user = request.user;
            }
        } catch (e) {
            request.log.warn(`Auth failed for topic ${id}: ${e.message}`);
        }
        
        // Update views
        db.prepare('UPDATE topics SET views = views + 1 WHERE id = ?').run(id);

        const topic = db.prepare(`
            SELECT t.*, u.username, u.nickname, u.role, u.points
            FROM topics t
            JOIN users u ON t.user_id = u.id
            WHERE t.id = ?
        `).get(id);

        if (!topic) {
            return reply.code(404).send({ error: 'Topic not found' });
        }
        
        // Add rank info
        const rank = getRank(topic.points || 0);
        topic.rankLevel = rank.level;

        const { accessDenied, denyReason, user: freshUser, hasPurchased } = checkTopicAccess(user, topic);
        user = freshUser;

        if (accessDenied) {
             return {
                 topic: {
                     id: topic.id,
                     title: topic.title,
                     username: topic.username,
                     nickname: topic.nickname,
                     role: topic.role,
                     created_at: topic.created_at,
                     updated_at: topic.updated_at,
                     views: topic.views,
                     is_pinned: topic.is_pinned,
                     is_featured: topic.is_featured,
                     is_solved: topic.is_solved,
                     bounty_points: topic.bounty_points,
                     view_permission_level: topic.view_permission_level,
                     view_points_required: topic.view_points_required,
                     content: '*** Content Hidden ***',
                     access_denied: true,
                     deny_reason: denyReason
                 },
                 comments: [] 
             };
        }

        const comments = db.prepare(`
            SELECT c.*, u.username, u.nickname, u.role, u.points
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.topic_id = ?
            ORDER BY c.created_at ASC
        `).all(id).map(c => {
            const rank = getRank(c.points || 0);
            return { ...c, rankLevel: rank.level };
        });

        return { topic: { ...topic, access_denied: false, has_purchased: hasPurchased }, comments };
    });

    // Create topic (Auth required)
    fastify.post('/topics', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const { title, content, bounty_points = 0, view_permission_level = 0, view_points_required = 0 } = request.body;
        const user_id = request.user.id;

        if (!title || !content) {
            return reply.code(400).send({ error: 'title_content_required' });
        }
        
        const bounty = parseInt(bounty_points) || 0;
        const permissionLevel = parseInt(view_permission_level) || 0;
        const pointsRequired = parseInt(view_points_required) || 0;
        
        if (bounty > 0) {
             const userPoints = getUserPointsAndRank(user_id);
             if (userPoints.points < bounty) {
                 return reply.code(400).send({ error: 'insufficient_points_bounty' });
             }
             const deducted = deductPoints(user_id, bounty, 'bounty_post');
             if (!deducted) return reply.code(400).send({ error: 'insufficient_points' });
        }

        const stmt = db.prepare('INSERT INTO topics (title, content, user_id, bounty_points, view_permission_level, view_points_required) VALUES (?, ?, ?, ?, ?, ?)');
        const result = stmt.run(title, content, user_id, bounty, permissionLevel, pointsRequired);

        // Award points for posting
        addPoints(user_id, 5, 'topic_post', result.lastInsertRowid);

        return { id: result.lastInsertRowid, message: 'Topic created successfully' };
    });

    // Add comment (Auth required)
    fastify.post('/topics/:id/comments', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        const { content, parent_id } = request.body;
        const user_id = request.user.id;

        if (!content) {
            return reply.code(400).send({ error: 'content_required' });
        }

        const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(id);
        if (!topic) {
            return reply.code(404).send({ error: 'Topic not found' });
        }

        // Check if user has access to this topic
        // We pass request.user (from token) to checkTopicAccess
        // It will fetch fresh user data and check permissions
        const { accessDenied, denyReason } = checkTopicAccess(request.user, topic);
        if (accessDenied) {
            return reply.code(403).send({ error: 'access_denied', reason: denyReason });
        }

        if (parent_id) {
            const parent = db.prepare('SELECT id FROM comments WHERE id = ? AND topic_id = ?').get(parent_id, id);
            if (!parent) {
                return reply.code(400).send({ error: 'parent_comment_not_found' });
            }
        }

        const stmt = db.prepare('INSERT INTO comments (topic_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)');
        const result = stmt.run(id, user_id, content, parent_id || null);
        
        // Process Mentions
        processMentions(content, user_id, 'comment', result.lastInsertRowid, `/index.html?view=forum&topic=${id}`);
        
        // Award points for comment
        addPoints(user_id, 2, 'topic_reply', result.lastInsertRowid);
        
        // Update topic updated_at
        db.prepare('UPDATE topics SET updated_at = strftime(\'%s\', \'now\') WHERE id = ?').run(id);

        // --- Notifications ---
        
        // 1. Notify Topic Owner (if someone else comments)
        const topicOwner = db.prepare('SELECT user_id, title FROM topics WHERE id = ?').get(id);
        if (topicOwner && topicOwner.user_id !== user_id) {
            const ownerSettings = db.prepare('SELECT notify_on_comment FROM users WHERE id = ?').get(topicOwner.user_id);
            if (ownerSettings && ownerSettings.notify_on_comment) {
                createNotification(
                    topicOwner.user_id,
                    JSON.stringify({ en: 'New Comment', zh: '新评论' }),
                    JSON.stringify({ 
                        en: `User ${request.user.nickname || request.user.username} commented on your topic "${topicOwner.title}"`,
                        zh: `用户 ${request.user.nickname || request.user.username} 评论了你的话题 "${topicOwner.title}"` 
                    }),
                    'forum',
                    `/index.html?view=forum&topic=${id}` // Frontend handles this query param to open topic? Need to check.
                    // Actually frontend doesn't handle query params for view routing directly on load in app.js...
                    // But wait, the notification click handler in frontend might need update or we rely on user navigation.
                    // Let's assume standard link or handle it later.
                    // Current frontend notification click: just shows alert or nothing?
                    // Let's check frontend logic later.
                );
            }
        }

        // 2. Notify Parent Comment Author (if replying)
        if (parent_id) {
            const parentComment = db.prepare(`
                SELECT c.user_id, c.content 
                FROM comments c 
                WHERE c.id = ?
            `).get(parent_id);
            
            // If parent author is different from current user AND different from topic owner (to avoid double notification if they are same)
            // Actually, if topic owner is also parent comment author, they might want to know it's a REPLY specifically?
            // Let's simplify: Notify parent author if they are not the current user.
            if (parentComment && parentComment.user_id !== user_id) {
                 // Check if we already notified them as topic owner
                 if (parentComment.user_id !== topicOwner.user_id) {
                     const parentSettings = db.prepare('SELECT notify_on_reply FROM users WHERE id = ?').get(parentComment.user_id);
                     if (parentSettings && parentSettings.notify_on_reply) {
                         createNotification(
                            parentComment.user_id,
                            JSON.stringify({ en: 'New Reply', zh: '新回复' }),
                            JSON.stringify({ 
                                en: `User ${request.user.nickname || request.user.username} replied to your comment: "${parentComment.content.substring(0, 20)}..."`,
                                zh: `用户 ${request.user.nickname || request.user.username} 回复了你的评论: "${parentComment.content.substring(0, 20)}..."` 
                            }),
                            'forum',
                            `/index.html?view=forum&topic=${id}`
                        );
                     }
                 } else {
                     // If topic owner is parent author, maybe update the message to say "replied to your comment" instead of "commented on topic"?
                     // Or just leave it as "New Comment" notification is enough.
                     // Let's leave it simple.
                 }
            }
        }

        return { message: 'Comment added successfully' };
    });

    // Solve Topic (Award Bounty)
    fastify.post('/topics/:id/solve', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        const { comment_id } = request.body;
        const user_id = request.user.id;
        
        const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(id);
        if (!topic) return reply.code(404).send({ error: 'Topic not found' });
        
        if (topic.user_id !== user_id && request.user.role !== 'admin' && request.user.role !== 'super_admin') {
            return reply.code(403).send({ error: 'permission_denied' });
        }
        
        if (topic.is_solved) return reply.code(400).send({ error: 'topic_already_solved' });
        
        const comment = db.prepare('SELECT * FROM comments WHERE id = ? AND topic_id = ?').get(comment_id, id);
        if (!comment) return reply.code(404).send({ error: 'comment_not_found' });
        
        // Mark as solved
        db.prepare('UPDATE topics SET is_solved = 1, solved_comment_id = ? WHERE id = ?').run(comment_id, id);
        
        // Award bounty if exists
        if (topic.bounty_points > 0) {
            addPoints(comment.user_id, topic.bounty_points, 'bounty_reward', id);
        }
        
        return { success: true };
    });
    
    // Purchase Topic
    fastify.post('/topics/:id/purchase', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const id = parseInt(request.params.id);
        const user_id = request.user.id;
        
        const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(id);
        if (!topic) return reply.code(404).send({ error: 'topic_not_found' });
        
        if (topic.view_points_required <= 0) return reply.code(400).send({ error: 'topic_is_free' });
        
        // Check if already purchased
        const existing = db.prepare('SELECT 1 FROM topic_purchases WHERE user_id = ? AND topic_id = ?').get(user_id, id);
        if (existing) return reply.code(400).send({ error: 'already_purchased' });
        
        // Check balance and deduct
        const success = deductPoints(user_id, topic.view_points_required, 'view_pay', id);
        if (!success) return reply.code(400).send({ error: 'insufficient_points' });
        
        // Record purchase
        db.prepare('INSERT INTO topic_purchases (user_id, topic_id, amount) VALUES (?, ?, ?)').run(user_id, id, topic.view_points_required);
        
        // Award points to author
        addPoints(topic.user_id, topic.view_points_required, 'view_earn', id);
        
        return { success: true };
    });

    // Update topic (Auth required)
    fastify.put('/topics/:id', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        const { title, content, bounty_points, view_permission_level, view_points_required } = request.body;
        const user_id = request.user.id;
        const role = request.user.role;

        if (!title || !content) {
            return reply.code(400).send({ error: 'Title and content are required' });
        }

        const topic = db.prepare('SELECT user_id FROM topics WHERE id = ?').get(id);
        if (!topic) {
            return reply.code(404).send({ error: 'Topic not found' });
        }

        if (topic.user_id !== user_id && !['admin', 'super_admin'].includes(role)) {
            return reply.code(403).send({ error: 'permission_denied' });
        }

        const bounty = parseInt(bounty_points) || 0;
        const permissionLevel = parseInt(view_permission_level) || 0;
        const pointsRequired = parseInt(view_points_required) || 0;

        db.prepare('UPDATE topics SET title = ?, content = ?, bounty_points = ?, view_permission_level = ?, view_points_required = ?, updated_at = strftime(\'%s\', \'now\') WHERE id = ?')
            .run(title, content, bounty, permissionLevel, pointsRequired, id);

        return { message: 'Topic updated successfully' };
    });

    // Toggle Pin (Admin only)
    fastify.patch('/topics/:id/pin', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        const { is_pinned } = request.body; // boolean or 0/1
        const role = request.user.role;

        if (!['admin', 'super_admin'].includes(role)) {
            return reply.code(403).send({ error: 'permission_denied' });
        }

        db.prepare('UPDATE topics SET is_pinned = ? WHERE id = ?').run(is_pinned ? 1 : 0, id);

        return { message: 'Topic pin status updated' };
    });

    // Toggle Feature (Admin only)
    fastify.patch('/topics/:id/feature', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        const { is_featured } = request.body; // boolean or 0/1
        const role = request.user.role;

        if (!['admin', 'super_admin'].includes(role)) {
            return reply.code(403).send({ error: 'Permission denied' });
        }

        db.prepare('UPDATE topics SET is_featured = ? WHERE id = ?').run(is_featured ? 1 : 0, id);

        return { message: 'Topic feature status updated' };
    });

    // Delete topic (Admin or Owner)
    fastify.delete('/topics/:id', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        const user = request.user;

        const topic = db.prepare('SELECT user_id FROM topics WHERE id = ?').get(id);
        if (!topic) {
            return reply.code(404).send({ error: 'Topic not found' });
        }

        if (user.role !== 'admin' && user.role !== 'super_admin' && user.id !== topic.user_id) {
            return reply.code(403).send({ error: 'permission_denied' });
        }

        // Delete comments first (if no CASCADE) - but we added ON DELETE CASCADE in schema
        db.prepare('DELETE FROM topics WHERE id = ?').run(id);

        return { message: 'Topic deleted successfully' };
    });

    // Delete comment (Admin, Owner, or Topic Owner)
    fastify.delete('/comments/:id', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        const user = request.user;

        // Get comment and its topic_id to check topic owner
        const comment = db.prepare(`
            SELECT c.user_id, c.topic_id, t.user_id as topic_owner_id 
            FROM comments c
            JOIN topics t ON c.topic_id = t.id
            WHERE c.id = ?
        `).get(id);

        if (!comment) {
            return reply.code(404).send({ error: 'comment_not_found' });
        }

        const isCommentOwner = user.id === comment.user_id;
        const isTopicOwner = user.id === comment.topic_owner_id;
        const isAdmin = user.role === 'admin' || user.role === 'super_admin';

        if (!isAdmin && !isCommentOwner && !isTopicOwner) {
            return reply.code(403).send({ error: 'permission_denied' });
        }

        db.prepare('DELETE FROM comments WHERE id = ?').run(id);

        return { message: 'Comment deleted successfully' };
    });
}
