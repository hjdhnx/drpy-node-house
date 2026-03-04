import { getPublicUserProfile } from '../services/authService.js';

export default async function (fastify, opts) {
  fastify.get('/:id/public', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params;
    const user = await getPublicUserProfile(id);
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }
    return user;
  });
}
