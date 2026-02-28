import db from '../db.js';
import bcrypt from 'bcryptjs';

export async function registerUser(username, password) {
  // Check if user exists
  const check = db.prepare('SELECT id FROM users WHERE username = ?');
  if (check.get(username)) {
    throw new Error('Username already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
  const info = stmt.run(username, hashedPassword);

  return { id: info.lastInsertRowid, username };
}

export async function loginUser(username, password) {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  const user = stmt.get(username);

  if (!user) {
    throw new Error('Invalid username or password');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new Error('Invalid username or password');
  }

  return { id: user.id, username: user.username };
}
