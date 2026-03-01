import db from '../db.js';
import bcrypt from 'bcryptjs';

export async function initSuperAdmin() {
  const stmt = db.prepare('SELECT count(*) as count FROM users');
  const result = stmt.get();

  if (result.count === 0) {
    console.log('No users found. Creating default super admin...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    // role and status are set by default in DB schema, but we force them here to be safe
    const insert = db.prepare("INSERT INTO users (username, password, role, status) VALUES (?, ?, 'admin', 'active')");
    insert.run('admin', hashedPassword);
    console.log('Default admin created: admin / admin123');
  }
}

export async function getRegistrationPolicy() {
  const stmt = db.prepare("SELECT value FROM settings WHERE key = 'registration_policy'");
  const result = stmt.get();
  return result ? result.value : 'open';
}

export async function getUploadConfig() {
  const stmt = db.prepare("SELECT key, value FROM settings");
  const results = stmt.all();

  const config = {
    allowed_extensions: '.json,.txt,.py,.php,.js,.m3u',
    max_file_size: 204800,
    allowed_tags: 'ds,dr2,cat,php,hipy,优,失效',
    anonymous_upload: 'false',
    anonymous_preview: 'false',
    anonymous_download: 'false',
    site_copyright: 'Copyright © 2026 Drpy Node House. All Rights Reserved.',
    site_icp: '京ICP备88888888号-1'
  };

  results.forEach(row => {
    if (row.key === 'max_file_size') {
      config[row.key] = parseInt(row.value, 10);
    } else {
      config[row.key] = row.value;
    }
  });

  return config;
}

export async function registerUser(username, password, inviteCode = null, reason = null) {
  // 1. Check Registration Policy
  const policy = await getRegistrationPolicy();

  if (policy === 'closed') {
    throw new Error('Registration is currently closed');
  }

  // 2. Check Invite Code if required
  if (policy === 'invite') {
    if (!inviteCode) {
      throw new Error('Invitation code is required');
    }
    const inviteStmt = db.prepare('SELECT * FROM invites WHERE code = ? AND (max_uses = 0 OR used_count < max_uses) AND (expires_at IS NULL OR expires_at > ?)');
    const invite = inviteStmt.get(inviteCode, Math.floor(Date.now() / 1000));

    if (!invite) {
      throw new Error('Invalid or expired invitation code');
    }

    // Increment used count
    db.prepare('UPDATE invites SET used_count = used_count + 1 WHERE code = ?').run(inviteCode);
  }

  // 3. Determine Initial Status
  // If policy is 'approval', status is 'pending'. Otherwise 'active'.
  const initialStatus = policy === 'approval' ? 'pending' : 'active';

  if (policy === 'approval' && !reason) {
    throw new Error('Application reason is required');
  }

  // 4. Check if user exists
  const check = db.prepare('SELECT id FROM users WHERE username = ?');
  if (check.get(username)) {
    throw new Error('Username already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const stmt = db.prepare('INSERT INTO users (username, password, role, status, reason) VALUES (?, ?, ?, ?, ?)');

  // Default role is 'user'
  const info = stmt.run(username, hashedPassword, 'user', initialStatus, reason);
  return { id: info.lastInsertRowid, username, role: 'user', status: initialStatus };
}

export async function loginUser(username, password) {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  const user = stmt.get(username);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Invalid username or password');
  }

  if (user.status === 'banned') {
    throw new Error('Account is banned');
  }

  // Pending users can login, but will have restricted access
  // if (user.status === 'pending') {
  //   throw new Error('Account is pending approval');
  // }

  return { id: user.id, username: user.username, role: user.role, status: user.status };
}

export async function changePassword(userId, oldPassword, newPassword) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const user = stmt.get(userId);

  if (!user) {
    throw new Error('User not found');
  }

  if (!(await bcrypt.compare(oldPassword, user.password))) {
    throw new Error('Incorrect old password');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const updateStmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');
  updateStmt.run(hashedPassword, userId);

  return { success: true };
}

export async function resetPassword(userId, newPassword) {
  const stmt = db.prepare('SELECT id FROM users WHERE id = ?');
  const user = stmt.get(userId);

  if (!user) {
    throw new Error('User not found');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const updateStmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');
  updateStmt.run(hashedPassword, userId);

  return { success: true };
}
