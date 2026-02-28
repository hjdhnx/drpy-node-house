import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export default {
  port: process.env.PORT || 3000,
  host: '0.0.0.0',
  paths: {
    root: rootDir,
    storage: path.join(rootDir, 'storage'), // IPFS blockstore/datastore location
    data: path.join(rootDir, 'data'),       // SQLite DB location
    public: path.join(rootDir, 'public'),
  },
  db: {
    filename: 'metadata.sqlite',
  }
};
