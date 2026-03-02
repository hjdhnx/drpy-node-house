import db from '../db.js';

export default async function forumRoutes(fastify, options) {
    // Get all topics (with pagination and optional search)
    fastify.get('/topics', async (request, reply) => {
        const { page = 1, limit = 10, search = '' } = request.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT t.*, u.username, u.nickname, u.role,
            (SELECT COUNT(*) FROM comments c WHERE c.topic_id = t.id) as comment_count
            FROM topics t
            JOIN users u ON t.user_id = u.id
        `;
        let countQuery = 'SELECT COUNT(*) as count FROM topics t JOIN users u ON t.user_id = u.id';
        const params = [];

        if (search) {
            query += ' WHERE t.title LIKE ? OR t.content LIKE ?';
            countQuery += ' WHERE t.title LIKE ? OR t.content LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY t.is_pinned DESC, t.updated_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const topics = db.prepare(query).all(...params);
        const total = db.prepare(countQuery).get(...params.slice(0, -2)).count;

        return {
            topics,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
        };
    });

    // Get single topic
    fastify.get('/topics/:id', async (request, reply) => {
        const { id } = request.params;
        
        // Update views
        db.prepare('UPDATE topics SET views = views + 1 WHERE id = ?').run(id);

        const topic = db.prepare(`
            SELECT t.*, u.username, u.nickname, u.role
            FROM topics t
            JOIN users u ON t.user_id = u.id
            WHERE t.id = ?
        `).get(id);

        if (!topic) {
            return reply.code(404).send({ error: 'Topic not found' });
        }

        const comments = db.prepare(`
            SELECT c.*, u.username, u.nickname, u.role
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.topic_id = ?
            ORDER BY c.created_at ASC
        `).all(id);

        return { topic, comments };
    });

    // Create topic (Auth required)
    fastify.post('/topics', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const { title, content } = request.body;
        const user_id = request.user.id;

        if (!title || !content) {
            return reply.code(400).send({ error: 'Title and content are required' });
        }

        const stmt = db.prepare('INSERT INTO topics (title, content, user_id) VALUES (?, ?, ?)');
        const result = stmt.run(title, content, user_id);

        return { id: result.lastInsertRowid, message: 'Topic created successfully' };
    });

    // Add comment (Auth required)
    fastify.post('/topics/:id/comments', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        const { content } = request.body;
        const user_id = request.user.id;

        if (!content) {
            return reply.code(400).send({ error: 'Content is required' });
        }

        const topic = db.prepare('SELECT id FROM topics WHERE id = ?').get(id);
        if (!topic) {
            return reply.code(404).send({ error: 'Topic not found' });
        }

        const stmt = db.prepare('INSERT INTO comments (topic_id, user_id, content) VALUES (?, ?, ?)');
        stmt.run(id, user_id, content);

        // Update topic updated_at
        db.prepare('UPDATE topics SET updated_at = strftime("%s", "now") WHERE id = ?').run(id);

        return { message: 'Comment added successfully' };
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
            return reply.code(403).send({ error: 'Permission denied' });
        }

        // Delete comments first (if no CASCADE) - but we added ON DELETE CASCADE in schema
        db.prepare('DELETE FROM topics WHERE id = ?').run(id);

        return { message: 'Topic deleted successfully' };
    });

    // Delete comment (Admin or Owner)
    fastify.delete('/comments/:id', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        const user = request.user;

        const comment = db.prepare('SELECT user_id FROM comments WHERE id = ?').get(id);
        if (!comment) {
            return reply.code(404).send({ error: 'Comment not found' });
        }

        if (user.role !== 'admin' && user.role !== 'super_admin' && user.id !== comment.user_id) {
            return reply.code(403).send({ error: 'Permission denied' });
        }

        db.prepare('DELETE FROM comments WHERE id = ?').run(id);

        return { message: 'Comment deleted successfully' };
    });
}
