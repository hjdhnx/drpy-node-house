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
  const stmt = db.prepare("SELECT key, value FROM settings WHERE key IN ('allowed_extensions', 'max_file_size')");
  const results = stmt.all();
  
  const config = {
    allowed_extensions: '.json,.txt,.py,.php,.js,.m3u',
    max_file_size: 102400
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

export async function registerUser(username, password, inviteCode = null) {
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

  // 4. Check if user exists
  const check = db.prepare('SELECT id FROM users WHERE username = ?');
  if (check.get(username)) {
    throw new Error('Username already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const stmt = db.prepare('INSERT INTO users (username, password, role, status) VALUES (?, ?, ?, ?)');
  
  // Default role is 'user'
  const info = stmt.run(username, hashedPassword, 'user', initialStatus);
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
  
  if (user.status === 'pending') {
    throw new Error('Account is pending approval');
  }

  return { id: user.id, username: user.username, role: user.role };
}
