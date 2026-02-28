import db from '../db.js';

export default async function (fastify, opts) {
  
  // Middleware to check if user is admin
  const requireAdmin = async (request, reply) => {
    try {
      await request.jwtVerify();
      const user = request.user;
      if (!user || user.role !== 'admin') {
        return reply.code(403).send({ error: 'Admin access required' });
      }
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  };

  // List all users
  fastify.get('/users', { onRequest: [requireAdmin] }, async (request, reply) => {
    try {
      const stmt = db.prepare('SELECT id, username, role, status, created_at FROM users ORDER BY created_at DESC');
      const users = stmt.all();
      return users;
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch users' });
    }
  });

  // Update user role/status
  fastify.put('/users/:id', { onRequest: [requireAdmin] }, async (request, reply) => {
    const { id } = request.params;
    const { role, status } = request.body;
    
    if (role && !['admin', 'user'].includes(role)) {
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

      return { success: true };
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to update user' });
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
