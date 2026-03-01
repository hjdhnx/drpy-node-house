import { registerUser, loginUser, changePassword, getRegistrationPolicy, getUploadConfig } from '../services/authService.js';

export default async function (fastify, opts) {

  fastify.get('/policy', async (request, reply) => {
    const policy = await getRegistrationPolicy();
    const uploadConfig = await getUploadConfig();
    return { policy, uploadConfig };
  });
  
  fastify.post('/register', async (request, reply) => {
    const { username, password, inviteCode, reason } = request.body;
    
    if (!username || !password) {
      return reply.code(400).send({ error: 'Username and password are required' });
    }

    try {
      const user = await registerUser(username, password, inviteCode, reason);
      
      if (user.status === 'pending') {
        return { user, message: 'Registration successful. Please wait for admin approval.' };
      }

      // Generate token
      const token = fastify.jwt.sign({ id: user.id, username: user.username, role: user.role });
      return { user, token };
    } catch (err) {
      if (err.message === 'Username already exists') {
        return reply.code(409).send({ error: err.message });
      }
      if (err.message === 'Registration is currently closed' || err.message === 'Invitation code is required' || err.message === 'Invalid or expired invitation code') {
        return reply.code(403).send({ error: err.message });
      }
      if (err.message === 'Application reason is required') {
        return reply.code(400).send({ error: err.message });
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
      const token = fastify.jwt.sign({ id: user.id, username: user.username, role: user.role });
      return { user, token };
    } catch (err) {
      if (err.message === 'Invalid username or password' || err.message === 'Account is banned' || err.message === 'Account is pending approval') {
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

  fastify.post('/change-password', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { oldPassword, newPassword } = request.body;

    if (!oldPassword || !newPassword) {
      return reply.code(400).send({ error: 'Old and new passwords are required' });
    }

    try {
      await changePassword(request.user.id, oldPassword, newPassword);
      return { success: true, message: 'Password changed successfully' };
    } catch (err) {
      if (err.message === 'Incorrect old password') {
        return reply.code(401).send({ error: err.message });
      }
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to change password' });
    }
  });
}
