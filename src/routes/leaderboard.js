import db, { orm } from '../db.js';
import { users, topics, comments, chatMessages, files } from '../schema.js';
import { desc, sql, count, eq } from 'drizzle-orm';
import { getRank } from '../services/pointsService.js';
import { DEFAULT_SETTINGS } from '../config.js';

export default async function leaderboardRoutes(fastify, options) {
    // Get all leaderboards
    fastify.get('/stats', async (request, reply) => {
        try {
            // Get limit from settings
            let limit = DEFAULT_SETTINGS.leaderboard_limit;
            try {
                const setting = await orm.select({ value: sql`value` })
                    .from(sql`settings`)
                    .where(sql`key = 'leaderboard_limit'`)
                    .get();
                if (setting && setting.value) {
                    limit = parseInt(setting.value, 10) || DEFAULT_SETTINGS.leaderboard_limit;
                }
            } catch (e) {
                // Fallback to default
            }

            // Helper to add rank info
            const addRank = (userList) => userList.map(u => ({
                ...u,
                rankTitle: getRank(u.points || 0).title
            }));

            // 1. Points Leaderboard (Rich List)
            const pointsLeaderboard = await orm.select({
                id: users.id,
                username: users.username,
                nickname: users.nickname,
                points: users.points,
                role: users.role
            })
            .from(users)
            .orderBy(desc(users.points))
            .limit(limit)
            .all();

            // 2. Topic Leaderboard (Most active posters)
            const topicLeaderboard = await orm.select({
                id: users.id,
                username: users.username,
                nickname: users.nickname,
                points: users.points,
                count: count(topics.id),
                role: users.role
            })
            .from(users)
            .leftJoin(topics, eq(users.id, topics.userId))
            .groupBy(users.id)
            .orderBy(desc(count(topics.id)))
            .limit(limit)
            .all();

            // 3. Comment Leaderboard (Most active commenters)
            const commentLeaderboard = await orm.select({
                id: users.id,
                username: users.username,
                nickname: users.nickname,
                points: users.points,
                count: count(comments.id),
                role: users.role
            })
            .from(users)
            .leftJoin(comments, eq(users.id, comments.userId))
            .groupBy(users.id)
            .orderBy(desc(count(comments.id)))
            .limit(limit)
            .all();

            // 4. Chat Leaderboard (Most active chatters)
            const chatLeaderboard = await orm.select({
                id: users.id,
                username: users.username,
                nickname: users.nickname,
                points: users.points,
                count: count(chatMessages.id),
                role: users.role
            })
            .from(users)
            .leftJoin(chatMessages, eq(users.id, chatMessages.userId))
            .groupBy(users.id)
            .orderBy(desc(count(chatMessages.id)))
            .limit(limit)
            .all();

            // 5. Files Leaderboard (Most active uploaders)
            const filesLeaderboard = await orm.select({
                id: users.id,
                username: users.username,
                nickname: users.nickname,
                points: users.points,
                count: count(files.id),
                role: users.role
            })
            .from(users)
            .leftJoin(files, eq(users.id, files.userId))
            .groupBy(users.id)
            .orderBy(desc(count(files.id)))
            .limit(limit)
            .all();

            const pointsWithRank = addRank(pointsLeaderboard);

            return {
                points: pointsWithRank,
                rank: pointsWithRank, // Rank leaderboard is same as points (sorted by points = sorted by rank)
                files: addRank(filesLeaderboard),
                topics: addRank(topicLeaderboard),
                comments: addRank(commentLeaderboard),
                chat: addRank(chatLeaderboard)
            };
        } catch (e) {
            request.log.error(e);
            return reply.code(500).send({ error: 'Failed to fetch leaderboard stats' });
        }
    });
}
