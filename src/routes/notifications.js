import { getNotifications, markAsRead, markAllAsRead } from '../services/notificationService.js';

export default async function (fastify, opts) {
  
  fastify.get('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const page = parseInt(request.query.page) || 1;
      const limit = parseInt(request.query.limit) || 20;
      const offset = (page - 1) * limit;
      
      const { notifications, unreadCount } = await getNotifications(request.user.id, limit, offset);
      return { notifications, unreadCount };
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch notifications' });
    }
  });

  fastify.post('/:id/read', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params;
    try {
      await markAsRead(request.user.id, id);
      return { success: true };
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to mark notification as read' });
    }
  });

  fastify.post('/read-all', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      await markAllAsRead(request.user.id);
      return { success: true };
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to mark all notifications as read' });
    }
  });
}
