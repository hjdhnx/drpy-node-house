import Fastify from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import path from 'path';
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
import { readFile } from 'fs/promises';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const fragmentTargets = [
  { id: 'top-header-fragment', url: '/fragments/top-header.html' },
  { id: 'file-stats-card-fragment', url: '/fragments/file-stats-card.html' },
  { id: 'community-sidebars-fragment', url: '/fragments/community-sidebars.html' },
  { id: 'footer-fragment', url: '/fragments/footer.html' },
  { id: 'scroll-buttons-fragment', url: '/fragments/scroll-buttons.html' },
  { id: 'emoji-picker-fragment', url: '/fragments/emoji-picker.html' },
  { id: 'auth-modals-fragment', url: '/fragments/auth-modals.html' },
  { id: 'forum-overlays-fragment', url: '/fragments/forum-overlays.html' },
  { id: 'main-modals-fragment', url: '/fragments/main-modals.html' }
];

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
    if (req.url.startsWith('/fragments/')) return true;
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

// Initialize services before starting
fastify.addHook('onReady', async () => {
  await initHelia();
  await initSuperAdmin();
});

// API Routes (Placeholder for now)
fastify.get('/api/status', async (request, reply) => {
  return { status: 'ok', timestamp: Date.now(), version: packageJson.version };
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

fastify.get('/api/fragments', async (request, reply) => {
  try {
    const entries = await Promise.all(fragmentTargets.map(async ({ id, url }) => {
      const filePath = path.join(config.paths.public, url.replace(/^\//, ''));
      const html = await readFile(filePath, 'utf8');
      return [`#${id}`, html];
    }));
    return Object.fromEntries(entries);
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: 'fragments_load_failed' });
  }
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
