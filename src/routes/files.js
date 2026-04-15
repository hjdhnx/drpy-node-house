import { uploadFile, listFiles, getFile, getFileStream, toggleVisibility, deleteFile, updateFileTags, getUploaders, replaceFile } from '../services/fileService.js';
import { getUploadConfig } from '../services/authService.js';
import path from 'path';

export default async function (fastify, opts) {

  const authenticateFlexible = async (request, reply) => {
    try {
      if (request.headers.authorization) {
        await request.jwtVerify();
        return;
      }
      const token = request.query.token || request.headers['x-api-token'];
      if (token) {
        request.user = await fastify.jwt.verify(token);
        return;
      }
    } catch (e) {
      // Fall through
    }
    reply.code(401).send({ error: 'Authentication required' });
  };
  
  // Upload file
  fastify.post('/upload', async (request, reply) => {
    // Check auth (optional, but needed for tracking user)
    let user = null;
    try {
      await request.jwtVerify();
      user = request.user;
    } catch (e) {
      // Ignore
    }

    const config = await getUploadConfig();
    
    // Check anonymous upload setting
    if (!user && config.anonymous_upload !== 'true') {
        return reply.code(401).send({ error: 'Anonymous upload is disabled. Please login.' });
    }

    const data = await request.file();
    
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    // Validation
    const allowedExtensions = config.allowed_extensions.split(',').map(e => e.trim().toLowerCase());
    const ext = path.extname(data.filename).toLowerCase();
    
    if (!allowedExtensions.includes(ext)) {
      // Consume stream to prevent hanging
      data.file.resume();
      return reply.code(400).send({ error: `File type not allowed. Allowed: ${config.allowed_extensions}` });
    }

    // Size check handled inside uploadFile (since it reads the stream)
    // or we can wrap the stream here.
    // Given uploadFile reads into buffer, let's pass the size limit to it.

    const isPublic = request.query.is_public !== 'false'; // Default true
    const tags = request.query.tags || '';
    
    if (!isPublic && !user) {
      data.file.resume();
      return reply.code(401).send({ error: 'You must be logged in to upload private files' });
    }

    try {
      const result = await uploadFile(data, user ? user.id : null, isPublic, config.max_file_size, tags);
      return result;
    } catch (err) {
      request.log.error(err);
      if (err.message.includes('File too large') || err.message.includes('过大')) {
        return reply.code(413).send({ error: err.message });
      }
      return reply.code(500).send({ error: 'Upload failed' });
    }
  });

  // List files
  fastify.get('/list', async (request, reply) => {
    let user = null;
    try {
      await request.jwtVerify();
      user = request.user;
    } catch (e) {
      // Ignore auth error, treat as guest
    }

    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const search = request.query.search || '';
    const tag = request.query.tag || '';
    const uploader = request.query.uploader || '';

    let uploaders = [];
    if (uploader) {
        uploaders = uploader.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    }

    try {
      return listFiles(user ? user.id : null, page, limit, search, tag, user ? user.role : 'user', uploaders);
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Fetch list failed' });
    }
  });

  // Get uploaders list
  fastify.get('/uploaders', async (request, reply) => {
    try {
      return getUploaders();
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch uploaders' });
    }
  });


  // Download/Preview file
  // Supports ?preview=true to set Content-Disposition: inline
  // Supports ?id=... to specify file record
  fastify.get('/download/:cid', async (request, reply) => {
    const { cid } = request.params;
    const isPreview = request.query.preview === 'true';
    const fileId = request.query.id; // Get file ID if provided
    
    let user = null;
    try {
      if (request.query.token) {
        user = await fastify.jwt.verify(request.query.token);
      } else {
        await request.jwtVerify();
        user = request.user;
      }
    } catch (e) {
      // Ignore
    }

    const config = await getUploadConfig();

    if (!user) {
        if (isPreview && config.anonymous_preview !== 'true') {
            return reply.code(401).send({ error: 'Anonymous preview is disabled. Please login.' });
        }
        if (!isPreview && config.anonymous_download !== 'true') {
             return reply.code(401).send({ error: 'Anonymous download is disabled. Please login.' });
        }
    }

    try {
      const { stream, filename, mimetype } = await getFileStream(cid, user, fileId);
      
      const encodedFilename = encodeURIComponent(filename);
      const dispositionType = isPreview ? 'inline' : 'attachment';
      
      reply.header('Content-Disposition', `${dispositionType}; filename*=UTF-8''${encodedFilename}`);
      
      // Ensure UTF-8 charset for text files to prevent garbled Chinese characters in browser preview
      let contentType = mimetype;
      
      // Force text/plain for code files that browser might try to download or execute
      // .py (text/x-python, application/x-python-code), .php (application/x-httpd-php, text/x-php)
      // Also handle common code extensions if mimetype detection is generic
      const textExtensions = ['.py', '.php', '.js', '.ts', '.c', '.cpp', '.h', '.java', '.rb', '.go', '.rs', '.sh', '.bat', '.cmd', '.ps1', '.sql', '.xml', '.yaml', '.yml', '.json', '.md', '.log', '.ini', '.conf'];
      const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
      
      if (isPreview) {
        if (textExtensions.includes(ext) || mimetype.startsWith('text/') || mimetype === 'application/json' || mimetype === 'application/javascript') {
          // Force text/plain for code files to ensure they display in browser instead of downloading
          // exception: keep html/xml/json as is if preferred, but for safety/viewing text/plain is safest for code
          if (!mimetype.includes('html')) { // Let HTML render? Or force text? User asked for "preview" usually implies seeing source for code.
             // For .py/.php specifically asked:
             if (['.py', '.php'].includes(ext)) {
               contentType = 'text/plain; charset=utf-8';
             } else if (!contentType.includes('charset=')) {
               contentType += '; charset=utf-8';
             }
          } else {
             if (!contentType.includes('charset=')) {
               contentType += '; charset=utf-8';
             }
          }
        }
      }
      reply.header('Content-Type', contentType);
      
      const { Readable } = await import('stream');
      const readable = Readable.from(stream);
      
      return reply.send(readable);
    } catch (err) {
      if (err.message === 'Unauthorized access to private file') {
        return reply.code(403).send({ error: 'Unauthorized access to private file' });
      }
      request.log.error(err);
      return reply.code(404).send({ error: 'File not found or retrieval failed' });
    }
  });

  // Get File Metadata
  fastify.get('/:cid', async (request, reply) => {
    const { cid } = request.params;
    const fileId = request.query.id; // Get file ID if provided
    let user = null;
    try {
      await request.jwtVerify();
      user = request.user;
    } catch (e) {
      // Ignore
    }

    try {
      return getFile(cid, user ? user.id : null, user ? user.role : 'user', fileId);
    } catch (err) {
      if (err.message === 'Unauthorized') return reply.code(403).send({ error: 'Unauthorized' });
      if (err.message === 'File not found') return reply.code(404).send({ error: 'File not found' });
      request.log.error(err);
      return reply.code(500).send({ error: 'Operation failed' });
    }
  });

  // Toggle Visibility
  fastify.post('/:id/toggle-visibility', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params;
    try {
      return toggleVisibility(id, request.user.id, request.user.role);
    } catch (err) {
      if (err.message === 'Unauthorized') return reply.code(403).send({ error: 'Unauthorized' });
      if (err.message === 'File not found') return reply.code(404).send({ error: 'File not found' });
      request.log.error(err);
      return reply.code(500).send({ error: 'Operation failed' });
    }
  });

  // Delete File
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params;
    try {
      return deleteFile(id, request.user.id, request.user.role);
    } catch (err) {
      if (err.message === 'Unauthorized') return reply.code(403).send({ error: 'Unauthorized' });
      if (err.message === 'File not found') return reply.code(404).send({ error: 'File not found' });
      request.log.error(err);
      return reply.code(500).send({ error: 'Operation failed' });
    }
  });

  // Replace File
  fastify.put('/:id/replace', {
    onRequest: [authenticateFlexible]
  }, async (request, reply) => {
    const { id } = request.params;
    const user = request.user;

    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    const config = await getUploadConfig();

    try {
      const result = await replaceFile(parseInt(id), data, user.id, user.role, config.max_file_size);
      return result;
    } catch (err) {
      request.log.error(err);
      if (err.message === 'Unauthorized') return reply.code(403).send({ error: 'Unauthorized' });
      if (err.message === 'File not found') return reply.code(404).send({ error: 'File not found' });
      if (err.message.includes('File type not allowed')) return reply.code(400).send({ error: err.message });
      if (err.message.includes('过大') || err.message.includes('too large')) return reply.code(413).send({ error: err.message });
      return reply.code(500).send({ error: 'Replace failed' });
    }
  });

  // Update File Tags
  fastify.put('/:id/tags', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params;
    const { tags } = request.body; // Expect array of strings

    if (!Array.isArray(tags)) {
        return reply.code(400).send({ error: 'Tags must be an array' });
    }

    // Validate tags against allowed list
    const config = await getUploadConfig();
    const allowedTags = config.allowed_tags.split(',').map(t => t.trim());
    
    const invalidTags = tags.filter(t => !allowedTags.includes(t));
    if (invalidTags.length > 0) {
        return reply.code(400).send({ error: `Invalid tags: ${invalidTags.join(', ')}` });
    }

    try {
      // Store as comma-separated string
      const tagsString = tags.join(',');
      return updateFileTags(id, tagsString, request.user.id, request.user.role);
    } catch (err) {
      if (err.message === 'Unauthorized') return reply.code(403).send({ error: 'Unauthorized' });
      if (err.message === 'File not found') return reply.code(404).send({ error: 'File not found' });
      request.log.error(err);
      return reply.code(500).send({ error: 'Operation failed' });
    }
  });
}
