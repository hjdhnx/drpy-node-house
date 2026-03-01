import db from '../db.js';

export async function createNotification(userId, title, message, type = 'system', link = null) {
  const stmt = db.prepare('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)');
  stmt.run(userId, title, message, type, link);
}

export async function getNotifications(userId, limit = 20, offset = 0) {
  const stmt = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?');
  const notifications = stmt.all(userId, limit, offset);
  
  const countStmt = db.prepare('SELECT count(*) as count FROM notifications WHERE user_id = ? AND is_read = 0');
  const unreadCount = countStmt.get(userId).count;
  
  return { notifications, unreadCount };
}

export async function markAsRead(userId, notificationId) {
  const stmt = db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?');
  stmt.run(notificationId, userId);
}

export async function markAllAsRead(userId) {
  const stmt = db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?');
  stmt.run(userId);
}

export async function notifyAdmins(title, message, type = 'system', link = null) {
  const stmt = db.prepare("SELECT id FROM users WHERE role IN ('admin', 'super_admin')");
  const admins = stmt.all();
  
  const insertStmt = db.prepare('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)');
  
  const transaction = db.transaction((admins) => {
    for (const admin of admins) {
      insertStmt.run(admin.id, title, message, type, link);
    }
  });
  
  transaction(admins);
}
