import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export default {
  port: process.env.PORT || 5678,
  host: '::',
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

// Centralized default configuration
// This file acts as the single source of truth for default system settings.
export const DEFAULT_SETTINGS = {
    // Registration & Auth
    registration_policy: 'open', // open, closed, approval, invite
    
    // File Uploads
    allowed_extensions: '.json,.txt,.py,.php,.js,.m3u',
    max_file_size: 204800, // 200KB in bytes
    allowed_tags: 'ds,dr2,cat,php,hipy,优,失效', // Updated with '优', '失效'
    
    // Anonymous Access
    anonymous_upload: 'false',
    anonymous_preview: 'false',
    anonymous_download: 'false',
    
    // Site Info
    site_copyright: 'Copyright © 2026 Drpy Node House. All Rights Reserved.',
    site_icp: '京ICP备88888888号-1',
    
    // Admin Features
    package_download_mode: 'essential', // 'essential' or 'all'
    
    // Notifications
    notification_limit: 10,
    notification_templates: JSON.stringify({
        'register_approval': {
            'en': { title: 'New Registration Request', message: 'User {{username}} has registered and requires approval.' },
            'zh': { title: '新用户注册申请', message: '用户 {{username}} 已注册，需要您的审核。' }
        },
        'account_approved': {
            'en': { title: 'Account Approved', message: 'Your account has been approved. You can now access all features.' },
            'zh': { title: '账号审核通过', message: '您的账号已通过审核，现在可以使用所有功能。' }
        },
        'account_banned': {
            'en': { title: 'Account Banned', message: 'Your account has been banned due to policy violations.' },
            'zh': { title: '账号已被封禁', message: '由于违反相关规定，您的账号已被封禁。' }
        },
        'account_unbanned': {
            'en': { title: 'Account Unbanned', message: 'Your account has been unbanned.' },
            'zh': { title: '账号解封', message: '您的账号已解除封禁。' }
        }
    }, null, 2)
};
