import db from '../src/db.js';

const args = process.argv.slice(2);
const command = args[0];

if (command === 'list') {
  const users = db.prepare('SELECT id, username, role FROM users').all();
  console.table(users);
} else if (command === 'set') {
  const username = args[1];
  const role = args[2];
  
  if (!username || !role) {
    console.error('Usage: bun scripts/manage_roles.js set <username> <role>');
    process.exit(1);
  }
  
  const info = db.prepare('UPDATE users SET role = ? WHERE username = ?').run(role, username);
  if (info.changes > 0) {
    console.log(`User ${username} updated to role ${role}`);
  } else {
    console.error(`User ${username} not found`);
  }
} else {
  console.log('Usage:');
  console.log('  bun scripts/manage_roles.js list');
  console.log('  bun scripts/manage_roles.js set <username> <role>');
}
