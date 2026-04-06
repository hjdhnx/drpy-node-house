import { registerUser, loginUser, changePassword, getRegistrationPolicy, getUploadConfig, getUserById, updateUserProfile } from '../services/authService.js';
import { checkin, getPointsHistory } from '../services/pointsService.js';
import { notifyAdminsTemplate } from '../services/notificationService.js';

export default async function (fastify, opts) {

  fastify.get('/policy', async (request, reply) => {
    const policy = await getRegistrationPolicy();
    const uploadConfig = await getUploadConfig();
    return { policy, uploadConfig };
  });
  
  fastify.post('/register', async (request, reply) => {
    const { username, password, inviteCode, reason } = request.body;
    
    if (!username || !password) {
      return reply.code(400).send({ error: 'username_password_required' });
    }

    try {
      const user = await registerUser(username, password, inviteCode, reason, request.ip);
      
      // Notify admins if pending approval
      if (user.status === 'pending') {
        notifyAdminsTemplate(
          'register_approval', 
          { username, reason }, 
          'approval',
          '/admin'
        );
      }

      // Generate token (Allow login even if pending)
      const token = fastify.jwt.sign({ id: user.id, username: user.username, nickname: user.nickname, role: user.role, status: user.status });
      return { user, token };
    } catch (err) {
      if (err.message === 'Username already exists') {
        return reply.code(409).send({ error: 'username_exists' });
      }
      if (err.message === 'Registration is currently closed') {
        return reply.code(403).send({ error: 'registration_closed' });
      }
      if (err.message === 'Invitation code is required') {
        return reply.code(403).send({ error: 'invite_code_required' });
      }
      if (err.message === 'Invalid or expired invitation code') {
        return reply.code(403).send({ error: 'invalid_invite_code' });
      }
      if (err.message === 'Application reason is required') {
        return reply.code(400).send({ error: 'reason_required' });
      }
      if (err.message.includes('Registration limit exceeded')) {
        return reply.code(429).send({ error: 'registration_limit_exceeded' });
      }
      request.log.error(err);
      return reply.code(500).send({ error: 'registration_failed' });
    }
  });

  fastify.post('/login', async (request, reply) => {
    const { username, password } = request.body;

    if (!username || !password) {
      return reply.code(400).send({ error: 'username_password_required' });
    }

    try {
      const user = await loginUser(username, password);
      const token = fastify.jwt.sign({ id: user.id, username: user.username, nickname: user.nickname, role: user.role, status: user.status });
      return { user, token };
    } catch (err) {
      if (err.message === 'Invalid username or password') {
        return reply.code(401).send({ error: 'invalid_credentials' });
      }
      if (err.message === 'Account is banned') {
        return reply.code(401).send({ error: 'account_banned' });
      }
      request.log.error(err);
      return reply.code(500).send({ error: 'login_failed' });
    }
  });

  fastify.post('/checkin', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    return checkin(request.user.id);
  });

  fastify.get('/points/history', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    return getPointsHistory(request.user.id);
  });

  fastify.get('/me', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    // Fetch fresh user data from DB instead of using stale token payload
    const user = await getUserById(request.user.id);
    if (!user) {
      return reply.code(404).send({ error: 'user_not_found' });
    }
    return user;
  });

  fastify.put('/me', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      console.log(`[PUT /me] User ${request.user.id} update payload:`, request.body);
      const updatedUser = await updateUserProfile(request.user.id, request.body);
      return updatedUser;
    } catch (err) {
      if (err.message === 'Nickname already exists') {
        return reply.code(409).send({ error: 'nickname_exists' });
      }
      request.log.error(err);
      return reply.code(500).send({ error: 'update_profile_failed' });
    }
  });

  fastify.post('/change-password', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { oldPassword, newPassword } = request.body;

    if (!oldPassword || !newPassword) {
      return reply.code(400).send({ error: 'passwords_required' });
    }

    try {
      await changePassword(request.user.id, oldPassword, newPassword);
      return { success: true, message: 'password_changed' };
    } catch (err) {
      if (err.message === 'Incorrect old password') {
        return reply.code(401).send({ error: 'incorrect_old_password' });
      }
      request.log.error(err);
      return reply.code(500).send({ error: 'change_password_failed' });
    }
  });
}
