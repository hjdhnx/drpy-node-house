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

// Initialize services before starting
fastify.addHook('onReady', async () => {
  await initHelia();
  await initSuperAdmin();
});

// API Routes (Placeholder for now)
fastify.get('/api/status', async (request, reply) => {
  return { status: 'ok', timestamp: Date.now() };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: config.port, host: config.host });
    console.log(`Server running at http://${config.host}:${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
