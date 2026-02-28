import { registerUser, loginUser } from '../services/authService.js';

export default async function (fastify, opts) {
  
  fastify.post('/register', async (request, reply) => {
    const { username, password } = request.body;
    
    if (!username || !password) {
      return reply.code(400).send({ error: 'Username and password are required' });
    }

    try {
      const user = await registerUser(username, password);
      // Generate token
      const token = fastify.jwt.sign({ id: user.id, username: user.username });
      return { user, token };
    } catch (err) {
      if (err.message === 'Username already exists') {
        return reply.code(409).send({ error: err.message });
      }
      request.log.error(err);
      return reply.code(500).send({ error: 'Registration failed' });
    }
  });

  fastify.post('/login', async (request, reply) => {
    const { username, password } = request.body;

    if (!username || !password) {
      return reply.code(400).send({ error: 'Username and password are required' });
    }

    try {
      const user = await loginUser(username, password);
      const token = fastify.jwt.sign({ id: user.id, username: user.username });
      return { user, token };
    } catch (err) {
      if (err.message === 'Invalid username or password') {
        return reply.code(401).send({ error: err.message });
      }
      request.log.error(err);
      return reply.code(500).send({ error: 'Login failed' });
    }
  });

  fastify.get('/me', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    return request.user;
  });
}
