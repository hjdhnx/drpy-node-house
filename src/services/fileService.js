import { getHelia } from '../ipfs.js';
import db from '../db.js';
import { CID } from 'multiformats/cid';

export async function uploadFile(file, userId = null, isPublic = true, maxSize = 0, tags = '') {
  const { fs } = await getHelia();
  
  const chunks = [];
  let totalSize = 0;

  for await (const chunk of file.file) {
    totalSize += chunk.length;
    if (maxSize > 0 && totalSize > maxSize) {
      // Consume remaining stream to avoid issues? Or just throw.
      // Throwing might leave the stream open, but we are inside an async iterator.
      throw new Error(`File too large. Max size: ${maxSize} bytes`);
    }
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  const content = new Uint8Array(buffer);

  const cid = await fs.addBytes(content);
  const cidString = cid.toString();

  // Save metadata to DB
  const stmt = db.prepare(`
    INSERT INTO files (cid, filename, mimetype, size, user_id, is_public, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const info = stmt.run(cidString, file.filename, file.mimetype, content.length, userId, isPublic ? 1 : 0, tags);

  return {
    id: info.lastInsertRowid,
    cid: cidString,
    filename: file.filename,
    size: content.length,
    user_id: userId,
    is_public: isPublic,
    tags: tags
  };
}

export function getFile(cid, userId = null, userRole = 'user') {
  const stmt = db.prepare('SELECT * FROM files WHERE cid = ?');
  const file = stmt.get(cid);

  if (!file) throw new Error('File not found');

  // Check permission
  if (userRole === 'super_admin') return file;
  
  if (file.is_public === 0) {
      if (!userId || file.user_id !== userId) {
          throw new Error('Unauthorized');
      }
  }

  return file;
}

export function listFiles(userId = null, page = 1, limit = 10, search = '', tag = '', userRole = 'user') {
  // Base query condition
  // We need to handle complex logic: (is_public OR is_owner) AND (filename LIKE %search%)
  
  let whereClause = 'WHERE (1=1'; // Start with true
  const params = [];

  // Permission check
  if (userRole !== 'super_admin') {
    whereClause += ' AND (is_public = 1';
    if (userId) {
      whereClause += ' OR user_id = ?';
      params.push(userId);
    }
    whereClause += ')';
  }
  whereClause += ')';

  if (search) {
    whereClause += ' AND filename LIKE ?';
    params.push(`%${search}%`);
  }

  if (tag) {
    const tags = tag.split(',').map(t => t.trim()).filter(t => t);
    if (tags.length > 0) {
      const tagConditions = tags.map(() => 'tags LIKE ?').join(' OR ');
      whereClause += ` AND (${tagConditions})`;
      tags.forEach(t => params.push(`%${t}%`));
    }
  } else {
    // Exclude hidden files by default if no tag is specified
    whereClause += " AND (tags IS NULL OR tags NOT LIKE '%chat-image%')";
  }

  // Count total items
  const countQuery = `SELECT COUNT(*) as total FROM files ${whereClause}`;
  const countStmt = db.prepare(countQuery);
  const totalResult = countStmt.get(...params);
  const total = totalResult ? totalResult.total : 0;
  
  // Calculate offset
  const offset = (page - 1) * limit;

  // Fetch paginated items
  const query = `
    SELECT files.*, users.username, users.nickname 
    FROM files 
    LEFT JOIN users ON files.user_id = users.id 
    ${whereClause}
    ORDER BY files.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const stmt = db.prepare(query);
  // Spread params first (for WHERE clause), then add limit and offset
  const files = stmt.all(...params, limit, offset);

  return {
    files,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getFileStream(cidString, userOrId = null) {
  const { fs } = await getHelia();
  const cid = CID.parse(cidString);
  
  let userId = null;
  let userRole = 'user';

  if (userOrId && typeof userOrId === 'object') {
      userId = userOrId.id;
      userRole = userOrId.role || 'user';
  } else {
      userId = userOrId;
  }
  
  // Check permission
  const stmt = db.prepare('SELECT * FROM files WHERE cid = ?');
  const fileRecord = stmt.get(cidString);

  if (fileRecord) {
    // If file is private
    if (fileRecord.is_public === 0) {
      let authorized = false;
      
      // 1. Owner or Admin access
      if (userId && (fileRecord.user_id === userId || userRole === 'admin' || userRole === 'super_admin')) {
          authorized = true;
      }

      // 2. Check if file is linked in a purchased topic
      if (!authorized && userId) {
          // Query: Find topics containing this CID
          const topicsWithFile = db.prepare('SELECT id, user_id, view_permission_level, view_points_required FROM topics WHERE content LIKE ?').all(`%${cidString}%`);
          
          for (const topic of topicsWithFile) {
              // Check 1: Is user the topic author?
              if (topic.user_id === userId) {
                  authorized = true;
                  break;
              }

              // Check 2: Is topic free?
              if (topic.view_points_required <= 0) {
                  // If public (level 0), anyone can see
                  if (topic.view_permission_level <= 0) {
                      authorized = true;
                      break;
                  }
                  // If login required (level > 0), check if logged in
                  // Note: We are skipping strict rank check here for performance/simplicity, 
                  // assuming if they have the link they might have access, or "Login Required" is the main barrier.
                  // For strict rank check, we would need to fetch user rank.
                  if (userId) {
                      authorized = true;
                      break;
                  }
              }
              
              // Check 3: Has user purchased this topic? (For paid topics)
              if (topic.view_points_required > 0) {
                  const purchase = db.prepare('SELECT 1 FROM topic_purchases WHERE user_id = ? AND topic_id = ?').get(userId, topic.id);
                  if (purchase) {
                      authorized = true;
                      break;
                  }
              }
          }
      }

      // 3. Check if file is linked in chat messages
      if (!authorized && userId) {
          // Check if this file CID is present in any chat message
          const chatMessage = db.prepare('SELECT 1 FROM chat_messages WHERE content LIKE ? LIMIT 1').get(`%${cidString}%`);
          if (chatMessage) {
              authorized = true;
          }
      }
 
      if (!authorized) {
         // Final check: Is it the owner? (Already checked above but let's be strict)
         if (!userId || fileRecord.user_id !== userId) {
             throw new Error('Unauthorized access to private file');
         }
      }
    }
  }

  // Create a stream from Helia
  const asyncIterable = fs.cat(cid);
  
  return {
    stream: asyncIterable,
    filename: fileRecord ? fileRecord.filename : cidString,
    mimetype: fileRecord ? fileRecord.mimetype : 'application/octet-stream'
  };
}

export function toggleVisibility(cidString, userId, userRole = 'user') {
  const stmt = db.prepare('SELECT * FROM files WHERE cid = ?');
  const file = stmt.get(cidString);

  if (!file) throw new Error('File not found');
  if (file.user_id !== userId && userRole !== 'super_admin') throw new Error('Unauthorized');

  const newStatus = file.is_public === 1 ? 0 : 1;
  const updateStmt = db.prepare('UPDATE files SET is_public = ? WHERE id = ?');
  updateStmt.run(newStatus, file.id);

  return { ...file, is_public: newStatus };
}

export async function deleteFile(cidString, userId, userRole = 'user') {
  const stmt = db.prepare('SELECT * FROM files WHERE cid = ?');
  const file = stmt.get(cidString);

  if (!file) throw new Error('File not found');
  if (file.user_id !== userId && userRole !== 'super_admin') throw new Error('Unauthorized');

  // Remove from DB
  const deleteStmt = db.prepare('DELETE FROM files WHERE id = ?');
  deleteStmt.run(file.id);

  return { success: true };
}

export function updateFileTags(cid, tags, userId, userRole = 'user') {
    const stmt = db.prepare('SELECT * FROM files WHERE cid = ?');
    const file = stmt.get(cid);
  
    if (!file) throw new Error('File not found');
    if (file.user_id !== userId && userRole !== 'super_admin') throw new Error('Unauthorized');
  
    const updateStmt = db.prepare('UPDATE files SET tags = ? WHERE id = ?');
    updateStmt.run(tags, file.id);
  
    return { ...file, tags };
  }
