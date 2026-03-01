import db from '../src/db.js';

const args = process.argv.slice(2);
const command = args[0];

if (command === 'list') {
  const settings = db.prepare('SELECT key, value FROM settings').all();
  console.table(settings);
} else if (command === 'get') {
  const key = args[1];
  if (!key) {
    console.error('Usage: bun scripts/manage_settings.js get <key>');
    process.exit(1);
  }
  const setting = db.prepare('SELECT key, value FROM settings WHERE key = ?').get(key);
  if (setting) {
    console.log(`${setting.key}: ${setting.value}`);
  } else {
    console.error(`Setting ${key} not found`);
  }
} else if (command === 'set') {
  const key = args[1];
  const value = args[2];
  
  if (!key || value === undefined) {
    console.error('Usage: bun scripts/manage_settings.js set <key> <value>');
    process.exit(1);
  }
  
  const info = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
  console.log(`Setting ${key} updated to: ${value}`);
} else {
  console.log('Usage:');
  console.log('  bun scripts/manage_settings.js list');
  console.log('  bun scripts/manage_settings.js get <key>');
  console.log('  bun scripts/manage_settings.js set <key> <value>');
}
