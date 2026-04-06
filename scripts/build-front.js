import { rm } from 'node:fs/promises';
import path from 'node:path';

const frontendDir = path.resolve('./frontend');

console.log('Building frontend project...');

await rm('./public/assets', { recursive: true, force: true });
await rm('./public/dist', { recursive: true, force: true });

const child = Bun.spawn({
  cmd: ['bun', 'run', 'build'],
  cwd: frontendDir,
  stdout: 'inherit',
  stderr: 'inherit'
});

const exitCode = await child.exited;

if (exitCode !== 0) {
  console.error(`Frontend build failed with exit code ${exitCode}`);
  process.exit(exitCode);
}

console.log('Frontend build successful!');
