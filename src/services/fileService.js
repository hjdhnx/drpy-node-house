import { getHelia } from '../ipfs.js';
import db from '../db.js';
import { CID } from 'multiformats/cid';

export async function uploadFile(file, userId = null, isPublic = true) {
  const { fs } = await getHelia();
  
  const chunks = [];
  for await (const chunk of file.file) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  const content = new Uint8Array(buffer);

  const cid = await fs.addBytes(content);
  const cidString = cid.toString();

  // Save metadata to DB
  const stmt = db.prepare(`
    INSERT INTO files (cid, filename, mimetype, size, user_id, is_public)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const info = stmt.run(cidString, file.filename, file.mimetype, content.length, userId, isPublic ? 1 : 0);

  return {
    id: info.lastInsertRowid,
    cid: cidString,
    filename: file.filename,
    size: content.length,
    user_id: userId,
    is_public: isPublic
  };
}

export function listFiles(userId = null, page = 1, limit = 10, search = '') {
  // Base query condition
  // We need to handle complex logic: (is_public OR is_owner) AND (filename LIKE %search%)
  
  let whereClause = 'WHERE (is_public = 1';
  const params = [];

  if (userId) {
    whereClause += ' OR user_id = ?';
    params.push(userId);
  }
  whereClause += ')';

  if (search) {
    whereClause += ' AND filename LIKE ?';
    params.push(`%${search}%`);
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
    SELECT files.*, users.username 
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

export async function getFileStream(cidString, userId = null) {
  const { fs } = await getHelia();
  const cid = CID.parse(cidString);
  
  // Check permission
  const stmt = db.prepare('SELECT * FROM files WHERE cid = ?');
  const fileRecord = stmt.get(cidString);

  if (fileRecord) {
    // If file is private and (user not logged in OR user is not the owner)
    if (fileRecord.is_public === 0) {
      if (!userId || fileRecord.user_id !== userId) {
        throw new Error('Unauthorized access to private file');
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

export function toggleVisibility(cidString, userId) {
  const stmt = db.prepare('SELECT * FROM files WHERE cid = ?');
  const file = stmt.get(cidString);

  if (!file) throw new Error('File not found');
  if (file.user_id !== userId) throw new Error('Unauthorized');

  const newStatus = file.is_public === 1 ? 0 : 1;
  const updateStmt = db.prepare('UPDATE files SET is_public = ? WHERE id = ?');
  updateStmt.run(newStatus, file.id);

  return { ...file, is_public: newStatus };
}

export async function deleteFile(cidString, userId) {
  const stmt = db.prepare('SELECT * FROM files WHERE cid = ?');
  const file = stmt.get(cidString);

  if (!file) throw new Error('File not found');
  if (file.user_id !== userId) throw new Error('Unauthorized');

  // Remove from DB
  const deleteStmt = db.prepare('DELETE FROM files WHERE id = ?');
  deleteStmt.run(file.id);

  // Note: We don't delete from IPFS/Helia immediately as it might be pinned or used by others (content addressing).
  // In a real system, we might unpin it and let GC handle it.
  
  return { success: true };
}
