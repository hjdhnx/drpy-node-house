import db from '../db.js';
import { resetPassword } from '../services/authService.js';
import { sendTemplateNotification } from '../services/notificationService.js';

export default async function (fastify, opts) {
  
  // Middleware to check if user is admin
  const requireAdmin = async (request, reply) => {
    try {
      await request.jwtVerify();
      const user = request.user;
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return reply.code(403).send({ error: 'Admin access required' });
      }
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  };

  // Middleware to check if user is super_admin
  const requireSuperAdmin = async (request, reply) => {
    try {
      await request.jwtVerify();
      const user = request.user;
      if (!user || user.role !== 'super_admin') {
        return reply.code(403).send({ error: 'Super Admin access required' });
      }
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  };

  // List all users
  fastify.get('/users', { onRequest: [requireAdmin] }, async (request, reply) => {
    try {
      const page = parseInt(request.query.page) || 1;
      const limit = parseInt(request.query.limit) || 10;
      const search = request.query.search || '';
      const offset = (page - 1) * limit;

      let countSql = 'SELECT count(*) as total FROM users';
      let dataSql = 'SELECT id, username, role, status, reason, created_at FROM users';
      const countParams = [];
      const dataParams = [];

      if (search) {
        const whereClause = ' WHERE username LIKE ? OR reason LIKE ?';
        countSql += whereClause;
        dataSql += whereClause;
        countParams.push(`%${search}%`, `%${search}%`);
        dataParams.push(`%${search}%`, `%${search}%`);
      }

      dataSql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      dataParams.push(limit, offset);

      const countStmt = db.prepare(countSql);
      const total = countStmt.get(...countParams).total;

      const stmt = db.prepare(dataSql);
      const users = stmt.all(...dataParams);

      return {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch users' });
    }
  });

  // Update user role/status
  fastify.put('/users/:id', { onRequest: [requireAdmin] }, async (request, reply) => {
    const { id } = request.params;
    const { role, status } = request.body;
    
    if (role && !['admin', 'user', 'super_admin'].includes(role)) {
      return reply.code(400).send({ error: 'Invalid role' });
    }
    if (status && !['active', 'pending', 'banned'].includes(status)) {
      return reply.code(400).send({ error: 'Invalid status' });
    }

    const updates = [];
    const params = [];
    if (role) {
      updates.push('role = ?');
      params.push(role);
    }
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return reply.code(400).send({ error: 'No updates provided' });
    }

    params.push(id);
    
    try {
      const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
      const info = stmt.run(...params);

      if (info.changes === 0) {
        return reply.code(404).send({ error: 'User not found' });
      }

      // Notify user on status change
      if (status) {
        if (status === 'active') {
          sendTemplateNotification(id, 'account_approved', {}, 'account');
        } else if (status === 'banned') {
          sendTemplateNotification(id, 'account_banned', {}, 'account');
        } else if (status === 'pending') {
          // Typically we don't set status back to pending, but if we did
        }
      }

      return { success: true };
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to update user' });
    }
  });

  // Delete user
  fastify.delete('/users/:id', { onRequest: [requireSuperAdmin] }, async (request, reply) => {
    const { id } = request.params;

    try {
      // Check if user exists and prevent self-deletion
      const userStmt = db.prepare('SELECT id, role FROM users WHERE id = ?');
      const targetUser = userStmt.get(id);

      if (!targetUser) {
        return reply.code(404).send({ error: 'User not found' });
      }

      if (targetUser.id === request.user.id) {
        return reply.code(400).send({ error: 'Cannot delete yourself' });
      }

      // Delete user's files first (optional, but good practice)
      // Note: We might want to keep files or reassign them, but deletion is requested.
      // For now, let's just delete the user record. Files will be orphaned in DB 
      // unless we add ON DELETE CASCADE or handle it manually.
      // Let's manually delete files to be safe and clean.
      
      const filesStmt = db.prepare('SELECT cid FROM files WHERE user_id = ?');
      const userFiles = filesStmt.all(id);
      
      // We should ideally call deleteFile service, but here we just delete DB records 
      // to keep it simple as per "backend management can delete user" requirement.
      // Real file deletion from IPFS/disk is separate.
      // Let's just delete from DB.
      
      const deleteFilesStmt = db.prepare('DELETE FROM files WHERE user_id = ?');
      deleteFilesStmt.run(id);

      const deleteUserStmt = db.prepare('DELETE FROM users WHERE id = ?');
      deleteUserStmt.run(id);

      return { success: true };
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to delete user' });
    }
  });

  // Reset user password (Admin)
  fastify.post('/users/:id/reset-password', { onRequest: [requireAdmin] }, async (request, reply) => {
    const { id } = request.params;
    const { password } = request.body;

    if (!password) {
      return reply.code(400).send({ error: 'New password is required' });
    }

    try {
      await resetPassword(id, password);
      return { success: true, message: 'Password reset successfully' };
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to reset password' });
    }
  });

  // Get system settings
  fastify.get('/settings', { onRequest: [requireAdmin] }, async (request, reply) => {
    try {
      const stmt = db.prepare('SELECT key, value FROM settings');
      const settings = stmt.all();
      const result = {};
      settings.forEach(s => result[s.key] = s.value);
      return result;
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch settings' });
    }
  });

  // Update system settings
  fastify.put('/settings', { onRequest: [requireAdmin] }, async (request, reply) => {
    const settings = request.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    
    const updateSettings = db.transaction((data) => {
      for (const [key, value] of Object.entries(data)) {
        stmt.run(key, value);
      }
    });

    try {
      updateSettings(settings);
      return { success: true };
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to update settings' });
    }
  });

  // List invite codes
  fastify.get('/invites', { onRequest: [requireAdmin] }, async (request, reply) => {
    try {
      const stmt = db.prepare(`
        SELECT i.*, u.username as created_by_username 
        FROM invites i 
        LEFT JOIN users u ON i.created_by = u.id
        ORDER BY i.created_at DESC
      `);
      const invites = stmt.all();
      return invites;
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch invites' });
    }
  });

  // Create invite code
  fastify.post('/invites', { onRequest: [requireAdmin] }, async (request, reply) => {
    const { code, max_uses, expires_at } = request.body;
    // Generate code if not provided
    const inviteCode = code || Math.random().toString(36).substring(2, 10).toUpperCase();
    const creatorId = request.user.id;
    
    try {
      const stmt = db.prepare('INSERT INTO invites (code, created_by, max_uses, expires_at) VALUES (?, ?, ?, ?)');
      stmt.run(inviteCode, creatorId, max_uses || 1, expires_at || null);
      return { code: inviteCode, max_uses: max_uses || 1, expires_at: expires_at || null };
    } catch (err) {
      // Check for unique constraint violation
      // bun:sqlite errors are typically strings or Error objects, need to be careful
      const errStr = err.toString();
      if (errStr.includes('UNIQUE constraint failed') || errStr.includes('constraint failed')) {
        return reply.code(409).send({ error: 'Invite code already exists' });
      }
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to create invite code' });
    }
  });

  // Delete invite code
  fastify.delete('/invites/:code', { onRequest: [requireAdmin] }, async (request, reply) => {
    const { code } = request.params;
    try {
      const stmt = db.prepare('DELETE FROM invites WHERE code = ?');
      const info = stmt.run(code);
      
      if (info.changes === 0) {
        return reply.code(404).send({ error: 'Invite code not found' });
      }
      return { success: true };
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to delete invite code' });
    }
  });
}
