import db from '../db.js';
import { DEFAULT_SETTINGS } from '../config.js';

export async function createNotification(userId, title, message, type = 'system', link = null) {
  const stmt = db.prepare('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)');
  stmt.run(userId, title, message, type, link);
}

export async function getNotifications(userId, limit = null, offset = 0) {
  // Get limit from settings if not provided
  if (limit === null) {
    const limitStmt = db.prepare("SELECT value FROM settings WHERE key = 'notification_limit'");
    const result = limitStmt.get();
    limit = result ? parseInt(result.value, 10) : 10;
  }

  const stmt = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY is_read ASC, created_at DESC LIMIT ? OFFSET ?');
  const notifications = stmt.all(userId, limit, offset);
  
  const countStmt = db.prepare('SELECT count(*) as count FROM notifications WHERE user_id = ? AND is_read = 0');
  const unreadCount = countStmt.get(userId).count;
  
  return { notifications, unreadCount, limit };
}

export async function getNotificationTemplate(key) {
  const stmt = db.prepare("SELECT value FROM settings WHERE key = 'notification_templates'");
  const result = stmt.get();
  
  let defaultTemplates = {};
  try {
    defaultTemplates = JSON.parse(DEFAULT_SETTINGS.notification_templates);
  } catch (e) {
    console.error('Failed to parse default notification templates', e);
  }

  let templates = defaultTemplates;
  if (result && result.value) {
    try {
      const storedTemplates = JSON.parse(result.value);
      templates = { ...defaultTemplates, ...storedTemplates };
    } catch (e) {
      console.error('Failed to parse notification templates', e);
    }
  }
  
  return templates[key] || null;
}

function formatMessage(template, data) {
  if (!template) return '';
  let result = {};
  for (const lang of Object.keys(template)) {
    let title = template[lang].title;
    let message = template[lang].message;
    for (const [key, value] of Object.entries(data)) {
      title = title.replace(`{{${key}}}`, value);
      message = message.replace(`{{${key}}}`, value);
    }
    result[lang] = { title, message };
  }
  return JSON.stringify(result);
}

export async function sendTemplateNotification(userId, templateKey, data = {}, type = 'system', link = null) {
  const template = await getNotificationTemplate(templateKey);
  if (!template) {
    console.warn(`Template ${templateKey} not found`);
    return;
  }
  
  const content = formatMessage(template, data);
  // Store the JSON string in both title and message? 
  // No, we store JSON string in title and message separately?
  // The DB schema has separate title and message columns.
  // Let's store:
  // title: JSON string {"en": "...", "zh": "..."}
  // message: JSON string {"en": "...", "zh": "..."}
  
  const contentObj = JSON.parse(content);
  const titleObj = {};
  const messageObj = {};
  
  for (const lang of Object.keys(contentObj)) {
    titleObj[lang] = contentObj[lang].title;
    messageObj[lang] = contentObj[lang].message;
  }
  
  await createNotification(userId, JSON.stringify(titleObj), JSON.stringify(messageObj), type, link);
}

export async function notifyAdminsTemplate(templateKey, data = {}, type = 'system', link = null) {
  const template = await getNotificationTemplate(templateKey);
  if (!template) {
    console.warn(`Template ${templateKey} not found`);
    return;
  }
  
  const content = formatMessage(template, data);
  const contentObj = JSON.parse(content);
  const titleObj = {};
  const messageObj = {};
  
  for (const lang of Object.keys(contentObj)) {
    titleObj[lang] = contentObj[lang].title;
    messageObj[lang] = contentObj[lang].message;
  }

  const title = JSON.stringify(titleObj);
  const message = JSON.stringify(messageObj);
  
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
