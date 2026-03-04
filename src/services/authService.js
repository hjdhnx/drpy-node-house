import db from '../db.js';
import bcrypt from 'bcryptjs';
import { DEFAULT_SETTINGS } from '../config.js';
import { getRank } from './pointsService.js';

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

  const config = { ...DEFAULT_SETTINGS };

  results.forEach(row => {
    if (row.key === 'max_file_size') {
      config[row.key] = parseInt(row.value, 10);
    } else {
      config[row.key] = row.value;
    }
  });

  // Filter out sensitive settings if any (though these are public config mostly)
  // We might want to exclude notification templates from public config if not needed, but frontend admin needs them?
  // Frontend admin fetches /api/admin/settings which is protected.
  // /api/auth/policy is public.
  // Let's exclude notification_templates from public config.
  const publicConfig = { ...config };
  delete publicConfig.notification_templates;
  delete publicConfig.registration_policy; // This is returned separately in getRegistrationPolicy but fine to keep consistent

  return publicConfig;
}

export async function registerUser(username, password, inviteCode = null, reason = null, ip = null) {
  // 1. Check Registration Policy
  const policy = await getRegistrationPolicy();

  if (policy === 'closed') {
    throw new Error('Registration is currently closed');
  }

  // Check IP limit (Anti-spam)
  if (ip) {
    // Get limit from settings or default
    const settingsStmt = db.prepare("SELECT value FROM settings WHERE key = 'registration_ip_limit'");
    const settingsResult = settingsStmt.get();
    
    let limit = DEFAULT_SETTINGS.registration_ip_limit;
    if (settingsResult && !isNaN(parseInt(settingsResult.value, 10))) {
        limit = parseInt(settingsResult.value, 10);
    }
    
    // If limit is 0 or less, disable the check (unlimited)
    if (limit > 0) {
        const window = 24 * 60 * 60; // 24 hours in seconds
        const timeThreshold = Math.floor(Date.now() / 1000) - window;
        
        const countStmt = db.prepare('SELECT count(*) as count FROM users WHERE registration_ip = ? AND created_at > ?');
        const result = countStmt.get(ip, timeThreshold);
        
        if (result.count >= limit) {
          throw new Error(`Registration limit exceeded. Max ${limit} accounts per 24 hours from this IP.`);
        }
    }
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
  const stmt = db.prepare('INSERT INTO users (username, password, role, status, reason, registration_ip) VALUES (?, ?, ?, ?, ?, ?)');

  // Default role is 'user'
  const info = stmt.run(username, hashedPassword, 'user', initialStatus, reason, ip);
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

  return { id: user.id, username: user.username, nickname: user.nickname, role: user.role, status: user.status };
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

export async function getUserById(userId) {
  const stmt = db.prepare('SELECT id, username, role, status, nickname, qq, email, phone, download_preference, notify_on_reply, notify_on_comment, show_scroll_buttons, points, last_checkin_date, created_at FROM users WHERE id = ?');
  const user = stmt.get(userId);
  
  if (user) {
    const rank = getRank(user.points || 0);
    user.rankLevel = rank.level;
    user.rankTitle = rank.title;
    
    const today = new Date().toISOString().split('T')[0];
    user.isCheckedIn = user.last_checkin_date === today;
  }
  
  return user;
}

export async function getPublicUserProfile(userId) {
  const stmt = db.prepare('SELECT id, username, nickname, role, status, created_at, points, qq FROM users WHERE id = ?');
  const user = stmt.get(userId);
  
  if (user) {
    const rank = getRank(user.points || 0);
    user.rankLevel = rank.level;
    user.rankTitle = rank.title;
    // Don't expose sensitive fields or internal flags
  }
  
  return user;
}

export async function updateUserProfile(userId, { nickname, qq, email, phone, download_preference, notify_on_reply, notify_on_comment, show_scroll_buttons }) {
  console.log(`[updateUserProfile] Updating user ${userId}:`, { nickname, qq, email, phone, download_preference, notify_on_reply, notify_on_comment, show_scroll_buttons });

  // Check nickname uniqueness if changed
  if (nickname) {
    const check = db.prepare('SELECT id FROM users WHERE nickname = ? AND id != ?');
    if (check.get(nickname, userId)) {
      throw new Error('Nickname already exists');
    }
  }

  const updates = [];
  const params = [];

  if (nickname !== undefined) { updates.push('nickname = ?'); params.push(nickname); }
  if (qq !== undefined) { updates.push('qq = ?'); params.push(qq); }
  if (email !== undefined) { updates.push('email = ?'); params.push(email); }
  if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
  if (download_preference !== undefined) { updates.push('download_preference = ?'); params.push(download_preference); }
  if (notify_on_reply !== undefined) { updates.push('notify_on_reply = ?'); params.push(notify_on_reply); }
  if (notify_on_comment !== undefined) { updates.push('notify_on_comment = ?'); params.push(notify_on_comment); }
  if (show_scroll_buttons !== undefined) { updates.push('show_scroll_buttons = ?'); params.push(show_scroll_buttons); }

  console.log('[updateUserProfile] SQL Updates:', updates);
  console.log('[updateUserProfile] SQL Params:', params);

  if (updates.length > 0) {
    params.push(userId);
    const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
    const result = stmt.run(...params);
    console.log('[updateUserProfile] DB Result:', result);
  }
  
  return getUserById(userId);
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
