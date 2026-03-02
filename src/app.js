import Fastify from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import path from 'path';
import config from './config.js';
import { initHelia } from './ipfs.js';
import { initSuperAdmin } from './services/authService.js';
import db from './db.js'; // Ensures DB is initialized
import fastifyJwt from '@fastify/jwt';
import fileRoutes from './routes/files.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import notificationRoutes from './routes/notifications.js';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));

const fastify = Fastify({
  logger: true
});

// Register plugins
fastify.register(fastifyCors, { 
  origin: true
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

// Register routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(fileRoutes, { prefix: '/api/files' });
fastify.register(adminRoutes, { prefix: '/api/admin' });
fastify.register(notificationRoutes, { prefix: '/api/notifications' });

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
