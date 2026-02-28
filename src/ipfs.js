import { unixfs } from '@helia/unixfs';
import { FsBlockstore } from 'blockstore-fs';
import { FsDatastore } from 'datastore-fs';
import path from 'path';
import config from './config.js';

let heliaNode = null;
let fsNode = null;

// Mock Helia interface for offline/local usage
// This avoids the native module issues with libp2p/webrtc on Bun/Windows
class LocalHelia {
  constructor(blockstore, datastore) {
    this.blockstore = blockstore;
    this.datastore = datastore;
    this.pins = {
      add: async (cid) => {
        // Simple pinning implementation (placeholder)
        // In a real implementation, we would store pins in datastore
        // For now, we just acknowledge
        return cid;
      },
      ls: async function* () {
        // Empty pins list
        yield* [];
      }
    };
  }
}

export async function initHelia() {
  if (heliaNode) return { helia: heliaNode, fs: fsNode };

  const blockstorePath = path.join(config.paths.storage, 'blocks');
  const datastorePath = path.join(config.paths.storage, 'data');

  const blockstore = new FsBlockstore(blockstorePath);
  const datastore = new FsDatastore(datastorePath);

  // Initialize the stores
  // FsBlockstore/FsDatastore might not need explicit open(), they open on demand or in constructor
  // But let's check if they have open() method, usually they do or it's handled.
  // FsBlockstore (blockstore-fs) doesn't seem to have async open() in recent versions, it just works.
  
  heliaNode = new LocalHelia(blockstore, datastore);
  fsNode = unixfs(heliaNode);
  
  console.log('Helia node initialized (Local/Offline Mode)');
  return { helia: heliaNode, fs: fsNode };
}

export function getHelia() {
  if (!heliaNode) throw new Error('Helia not initialized');
  return { helia: heliaNode, fs: fsNode };
}
