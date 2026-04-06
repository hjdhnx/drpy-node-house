import Fastify from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import config, { DEFAULT_SETTINGS } from './config.js';
import { initHelia } from './ipfs.js';
import { initSuperAdmin } from './services/authService.js';
import db from './db.js'; // Ensures DB is initialized
import fastifyJwt from '@fastify/jwt';
import fastifyWebsocket from '@fastify/websocket';
import fileRoutes from './routes/files.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import notificationRoutes from './routes/notifications.js';
import forumRoutes from './routes/forum.js';
import chatRoutes from './routes/chat.js';
import userRoutes from './routes/users.js';
import leaderboardRoutes from './routes/leaderboard.js';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));

const fastify = Fastify({
  logger: true,
  trustProxy: true // Trust proxy headers (X-Forwarded-For) for correct IP detection behind Nginx/Caddy
});

// Register plugins
fastify.register(fastifyCors, { 
  origin: true
});

// Get rate limit from settings
const rateLimitStmt = db.prepare("SELECT value FROM settings WHERE key = 'rate_limit_max'");
const rateLimitResult = rateLimitStmt.get();
const rateLimitMax = rateLimitResult ? parseInt(rateLimitResult.value, 10) : (DEFAULT_SETTINGS.rate_limit_max || 100);

fastify.register(fastifyRateLimit, {
  max: rateLimitMax,
  timeWindow: '1 minute', // per minute
  allowList: (req) => {
    // Exclude static files (images, css, js, fonts)
    if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$/i)) return true;
    return false;
  }
});

fastify.register(fastifyJwt, {
  secret: 'supersecret' // In production, use environment variable
});

// Auth decorator
fastify.decorate("authenticate", async function(request, reply) {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
})

fastify.register(fastifyMultipart, {
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

fastify.register(fastifyStatic, {
  root: config.paths.public,
  prefix: '/', // Serve static files from root
});

fastify.register(fastifyWebsocket);

// Register routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(fileRoutes, { prefix: '/api/files' });
fastify.register(adminRoutes, { prefix: '/api/admin' });
fastify.register(notificationRoutes, { prefix: '/api/notifications' });
fastify.register(forumRoutes, { prefix: '/api/forum' });
fastify.register(chatRoutes, { prefix: '/ws' });
fastify.register(userRoutes, { prefix: '/api/users' });
fastify.register(leaderboardRoutes, { prefix: '/api/leaderboard' });

fastify.get('/admin', async (request, reply) => {
  return reply.sendFile('admin.html');
});

fastify.get('/admin/', async (request, reply) => {
  return reply.sendFile('admin.html');
});

fastify.get('/', async (request, reply) => {
  return reply.sendFile('index.html');
});

fastify.setNotFoundHandler(async (request, reply) => {
  const acceptHeader = request.headers.accept || '';
  const acceptsHtml = !acceptHeader || acceptHeader.includes('text/html') || acceptHeader.includes('*/*');
  const isSpaRoute = request.method === 'GET'
    && acceptsHtml
    && !request.url.startsWith('/api/')
    && !request.url.startsWith('/ws')
    && !request.url.startsWith('/admin')
    && !request.url.startsWith('/assets/')
    && !request.url.includes('.');

  if (isSpaRoute) {
    return reply.type('text/html').sendFile('index.html');
  }

  return reply.code(404).send({
    error: 'Not Found',
    message: `Route ${request.method}:${request.url} not found`,
    statusCode: 404
  });
});

// Initialize services before starting
fastify.addHook('onReady', async () => {
  await initHelia();
  await initSuperAdmin();
});

// API Routes (Placeholder for now)
fastify.get('/api/status', async (request, reply) => {
  const isBun = typeof Bun !== 'undefined';
  return { 
    status: 'ok', 
    timestamp: Date.now(), 
    version: packageJson.version,
    env: {
      os: process.platform,
      arch: process.arch,
      runtime: isBun ? 'Bun' : 'Node',
      version: isBun ? Bun.version : process.version
    }
  };
});

fastify.get('/api/config', async (request, reply) => {
  const settings = db.prepare('SELECT key, value FROM settings').all();
  const config = {};
  settings.forEach(s => {
    config[s.key] = s.value;
  });
  
  // Filter for public keys only to avoid exposing secrets if any
  const publicKeys = [
    'site_name', 'site_copyright', 'site_icp', 
    'registration_policy', 
    'anonymous_upload', 'anonymous_preview', 'anonymous_download',
    'allowed_extensions', 'max_file_size', 'allowed_tags'
  ];
  
  const publicConfig = {};
  publicKeys.forEach(k => {
    if (config[k] !== undefined) publicConfig[k] = config[k];
  });
  
  return publicConfig;
});

// Start server
const start = async () => {
  try {
    const address = await fastify.listen({ port: config.port, host: config.host });
    console.log(`Server running at ${address}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
