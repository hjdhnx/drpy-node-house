import { getHelia } from '../ipfs.js';
import db from '../db.js';
import { CID } from 'multiformats/cid';
import sharp from 'sharp';
import { getUploadConfig } from './authService.js';
import { getRank } from './pointsService.js';

export async function uploadFile(file, userId = null, isPublic = true, maxSize = 0, tags = '') {
  const { fs } = await getHelia();
  
  // Get config for compression check
  const config = await getUploadConfig();
  const isCompressionEnabled = config.image_compression_enabled === 'true';
  const isImage = file.mimetype.startsWith('image/');

  const chunks = [];
  let totalSize = 0;

  for await (const chunk of file.file) {
    totalSize += chunk.length;
    
    // Only enforce size limit during stream if compression is NOT enabled or NOT an image
    // If compression is enabled, we need to wait for the full buffer to compress and check size then
    if (maxSize > 0 && !isCompressionEnabled && !isImage && totalSize > maxSize) {
      throw new Error(`文件体积过大。当前体积已超过限制: ${(maxSize / 1024).toFixed(2)} KB`);
    }
    
    // Safety cap for memory usage if waiting for compression (e.g. 50MB hard limit or 2x maxSize)
    // To prevent OOM attacks if someone uploads a 10GB file hoping it compresses to 500KB
    if (maxSize > 0 && (isCompressionEnabled && isImage) && totalSize > (Math.max(maxSize * 2, 52428800))) {
         throw new Error(`文件过大无法处理，超出安全限制。`);
    }

    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  
  // Image Compression Logic
  let finalBuffer = buffer;
  try {
    if (isCompressionEnabled && isImage) {
        const image = sharp(buffer);
        const metadata = await image.metadata();
        
        // Skip small images (e.g. < 10KB) to avoid overhead
        if (buffer.length > 10240) {
            let processed = null;
            
            if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
                processed = image.jpeg({ quality: 80, mozjpeg: true });
            } else if (metadata.format === 'png') {
                processed = image.png({ compressionLevel: 6, palette: true });
            } else if (metadata.format === 'webp') {
                processed = image.webp({ quality: 80 });
            }
            
            // Only process supported formats and skip animated GIFs for safety unless we handle them specifically
            if (processed && (!metadata.pages || metadata.pages <= 1)) {
                const compressedBuffer = await processed.toBuffer();
                if (compressedBuffer.length < buffer.length) {
                    console.log(`[Image Compression] ${file.filename}: ${buffer.length} -> ${compressedBuffer.length} bytes (-${Math.round((1 - compressedBuffer.length / buffer.length) * 100)}%)`);
                    finalBuffer = compressedBuffer;
                }
            }
        }
    }
  } catch (e) {
    console.error('[Image Compression Error]', e);
    // Continue with original buffer
  }

  // Final Size Check
  if (maxSize > 0 && finalBuffer.length > maxSize) {
      if (isImage && isCompressionEnabled) {
         throw new Error(`图片压缩后体积仍然过大。原始体积: ${(buffer.length / 1024).toFixed(2)} KB，压缩后体积: ${(finalBuffer.length / 1024).toFixed(2)} KB，最大限制: ${(maxSize / 1024).toFixed(2)} KB`);
      }
      throw new Error(`文件体积过大。当前体积: ${(finalBuffer.length / 1024).toFixed(2)} KB，最大限制: ${(maxSize / 1024).toFixed(2)} KB`);
  }

  const content = new Uint8Array(finalBuffer);

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

export function getFile(cid, userId = null, userRole = 'user', fileId = null) {
  const stmt = db.prepare('SELECT * FROM files WHERE cid = ?');
  const files = stmt.all(cid);
  
  if (files.length === 0) throw new Error('File not found');

  // Priority 0: Specific File ID
  if (fileId) {
      const specificFile = files.find(f => f.id == fileId);
      if (specificFile) {
           // Check permission for this specific file
           if (specificFile.is_public === 1) return specificFile;
           if (userId && specificFile.user_id === userId) return specificFile;
           if (userRole === 'admin' || userRole === 'super_admin') return specificFile;
      }
      // If found but unauthorized, or not found in this CID group (mismatch?), fall through?
      // If mismatch (CID doesn't match ID), it won't be in `files`.
      // If unauthorized, fall through to see if we can give them *another* file? 
      // See discussion above: Safer to fall through to public version if unauthorized for private specific version.
  }

  // Priority 1: User's own file
  if (userId) {
      const ownFile = files.find(f => f.user_id === userId);
      if (ownFile) return ownFile;
  }

  // Priority 2: Public file
  const publicFile = files.find(f => f.is_public === 1);
  if (publicFile) return publicFile;

  // Priority 3: Admin access
  if (userRole === 'admin' || userRole === 'super_admin') {
      return files[0];
  }

  throw new Error('Unauthorized');
}

export function getUploaders() {
  const stmt = db.prepare(`
    SELECT DISTINCT u.id, u.username, u.nickname 
    FROM users u 
    JOIN files f ON u.id = f.user_id 
    WHERE f.is_public = 1
    ORDER BY u.nickname ASC, u.username ASC
  `);
  return stmt.all();
}

export function listFiles(userId = null, page = 1, limit = 10, search = '', tag = '', userRole = 'user', uploaders = []) {
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

  if (uploaders && uploaders.length > 0) {
    const placeholders = uploaders.map(() => '?').join(',');
    whereClause += ` AND user_id IN (${placeholders})`;
    params.push(...uploaders);
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

export async function getFileStream(cidString, userOrId = null, fileId = null) {
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
  
  // Get all files with this CID to correctly handle ownership/visibility
  const stmt = db.prepare('SELECT * FROM files WHERE cid = ?');
  const files = stmt.all(cidString);
  
  let fileRecord = null;
  let authorized = false;

  if (files.length > 0) {
    // 0. Check specific file ID if provided (Highest Priority)
    if (fileId) {
        fileRecord = files.find(f => f.id == fileId);
        if (fileRecord) {
             // Check permission for this specific file
             if (fileRecord.is_public === 1) {
                 authorized = true;
             } else if (userId && fileRecord.user_id === userId) {
                 authorized = true;
             } else if (userRole === 'admin' || userRole === 'super_admin') {
                 authorized = true;
             }
        }
    }

    // If no specific file requested or authorized yet, fall back to priority logic
    if (!authorized) {
        // 1. Check if user owns any of these files (Priority 1: User's own file)
        if (userId) {
            fileRecord = files.find(f => f.user_id === userId);
            if (fileRecord) authorized = true;
        }

        // 2. Check if any file is public (Priority 2: Public file)
        if (!authorized) {
            const publicFile = files.find(f => f.is_public === 1);
            if (publicFile) {
                fileRecord = publicFile;
                authorized = true;
            }
        }

        // 3. Admin Access
        if (!authorized && (userRole === 'admin' || userRole === 'super_admin')) {
            fileRecord = files[0];
            authorized = true;
        }
    }

    // If still not authorized, check other permissions (Topics, Chat)
    if (!authorized && files.length > 0) {
      // Use the first file record for metadata reference, but access is still pending
      const refFile = files[0]; 

      // Check 2: Is file linked in a purchased/free topic?
      if (userId) {
          // Query: Find topics containing this CID
          const topicsWithFile = db.prepare('SELECT id, user_id, view_permission_level, view_points_required FROM topics WHERE content LIKE ?').all(`%${cidString}%`);
          
          for (const topic of topicsWithFile) {
              // Topic author
              if (topic.user_id === userId) {
                  authorized = true;
                  fileRecord = refFile;
                  break;
              }
              // Free topic
              if (topic.view_points_required <= 0 && topic.view_permission_level <= 0) {
                  authorized = true;
                  fileRecord = refFile;
                  break;
              }

              let canView = true;

              // Check Permission Level (Rank)
              if (topic.view_permission_level > 0) {
                   const user = db.prepare('SELECT points FROM users WHERE id = ?').get(userId);
                   const userPoints = user ? user.points : 0;
                   const userRank = getRank(userPoints);
                   
                   if (userRank.level < topic.view_permission_level) {
                       canView = false;
                   }
              }

              // Check Points Required (Purchase)
              if (canView && topic.view_points_required > 0) {
                  const purchase = db.prepare('SELECT 1 FROM topic_purchases WHERE user_id = ? AND topic_id = ?').get(userId, topic.id);
                  if (!purchase) {
                      canView = false;
                  }
              }
              
              if (canView) {
                  authorized = true;
                  fileRecord = refFile;
                  break;
              }
          }
      }

      // Check 3: Linked in chat?
      if (!authorized && userId) {
          const chatMessage = db.prepare('SELECT 1 FROM chat_messages WHERE content LIKE ? LIMIT 1').get(`%${cidString}%`);
          if (chatMessage) {
              authorized = true;
              fileRecord = refFile;
          }
      }
    }
  }

  if (files.length > 0 && !authorized) {
      throw new Error('Unauthorized access to private file');
  }

  // Create a stream from Helia
  const asyncIterable = fs.cat(cid);
  
  return {
    stream: asyncIterable,
    filename: fileRecord ? fileRecord.filename : cidString,
    mimetype: fileRecord ? fileRecord.mimetype : 'application/octet-stream'
  };
}

export function toggleVisibility(id, userId, userRole = 'user') {
  const stmt = db.prepare('SELECT * FROM files WHERE id = ?');
  const file = stmt.get(id);

  if (!file) throw new Error('File not found');
  if (file.user_id !== userId && userRole !== 'super_admin') throw new Error('Unauthorized');

  const newStatus = file.is_public === 1 ? 0 : 1;
  const updateStmt = db.prepare('UPDATE files SET is_public = ? WHERE id = ?');
  updateStmt.run(newStatus, file.id);

  return { ...file, is_public: newStatus };
}

export async function deleteFile(id, userId, userRole = 'user') {
  const stmt = db.prepare('SELECT * FROM files WHERE id = ?');
  const file = stmt.get(id);

  if (!file) throw new Error('File not found');
  if (file.user_id !== userId && userRole !== 'super_admin') throw new Error('Unauthorized');

  // Remove from DB
  const deleteStmt = db.prepare('DELETE FROM files WHERE id = ?');
  deleteStmt.run(file.id);

  return { success: true };
}

export function updateFileTags(id, tags, userId, userRole = 'user') {
    const stmt = db.prepare('SELECT * FROM files WHERE id = ?');
    const file = stmt.get(id);
  
    if (!file) throw new Error('File not found');
    if (file.user_id !== userId && userRole !== 'super_admin') throw new Error('Unauthorized');
  
    const updateStmt = db.prepare('UPDATE files SET tags = ? WHERE id = ?');
    updateStmt.run(tags, file.id);
  
    return { ...file, tags };
  }
