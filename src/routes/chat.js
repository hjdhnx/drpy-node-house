import db from '../db.js';
import { getUserById } from '../services/authService.js';
import { DEFAULT_SETTINGS } from '../config.js';

const clients = new Set();

// Helper to get chat interval
function getChatInterval() {
    try {
        const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
        const row = stmt.get('chat_interval');
        return row ? parseInt(row.value) : DEFAULT_SETTINGS.chat_interval;
    } catch (e) {
        return DEFAULT_SETTINGS.chat_interval;
    }
}

export default async function chatRoutes(fastify, options) {
  fastify.get('/chat', { websocket: true }, (connection, req) => {
    // Debug logging
    // console.log('WebSocket connection type:', typeof connection);
    // console.log('WebSocket connection keys:', connection ? Object.keys(connection) : 'null');
    
    if (!connection) {
        console.error('WebSocket connection is undefined');
        return;
    }
    
    // Handle case where connection might be the socket itself (unlikely in fastify-websocket but possible in some setups)
    const socket = connection.socket || connection;
    
    if (!socket) {
      console.error('WebSocket connection error: socket is undefined');
      return;
    }

    // Basic connection handling
    clients.add(connection);
    
    // Send initial history
    try {
      const history = db.prepare(`
        SELECT m.*, u.username, u.nickname, u.role
        FROM chat_messages m
        JOIN users u ON m.user_id = u.id
        ORDER BY m.created_at DESC
        LIMIT 50
      `).all().reverse();
      
      if (socket.readyState === 1) {
          socket.send(JSON.stringify({ 
              type: 'history', 
              data: history,
              chatInterval: getChatInterval()
          }));
      }
    } catch (e) {
      console.error('Error fetching chat history:', e);
    }

    // Handle incoming messages
    socket.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        // Authenticate (expecting token in first message or query param?
        // For simplicity, let's assume the client sends a token in the 'auth' message type
        if (data.type === 'auth') {
          try {
            const decoded = fastify.jwt.verify(data.token);
            // Fetch fresh user info from DB to ensure nickname is up to date
            const user = await getUserById(decoded.id);
            if (!user) throw new Error('User not found');
            
            connection.user = user;
            // Broadcast user join?
            broadcast({ type: 'system_join', user: user.nickname || user.username });
            broadcastOnlineUsers();
          } catch (err) {
            if (socket.readyState === 1) {
                socket.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
                // Do not close connection, just let them be anonymous
            }
          }
          return;
        }

        if (!connection.user) {
          if (socket.readyState === 1) {
              socket.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }));
          }
          return;
        }

        if (data.type === 'recall') {
            const messageId = data.messageId;
            if (!messageId) return;

            // Fetch message to verify ownership
            const msg = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(messageId);
            if (!msg) {
                if (socket.readyState === 1) {
                    socket.send(JSON.stringify({ type: 'error', message: 'Message not found' }));
                }
                return;
            }

            // Check permissions
            const isAuthor = connection.user.id === msg.user_id;
            const isAdmin = ['admin', 'super_admin'].includes(connection.user.role);

            if (isAuthor || isAdmin) {
                // Delete message
                db.prepare('DELETE FROM chat_messages WHERE id = ?').run(messageId);
                
                // Broadcast recall event
                broadcast({ type: 'recall', messageId: messageId });
                
                // Broadcast system notification
                const operatorName = connection.user.nickname || connection.user.username;
                // We should send a structured system message so the frontend can localize it
                // type: 'system_recall', operator: operatorName
                broadcast({ type: 'system_recall', operator: operatorName });
            } else {
                if (socket.readyState === 1) {
                    socket.send(JSON.stringify({ type: 'error', message: 'Permission denied' }));
                }
            }
            return;
        }

        if (data.type === 'message') {
            const content = data.content;
            if (!content) return;

            // Rate limiting check
            const now = Date.now();
            const lastMessageTime = connection.lastMessageTime || 0;
            const chatInterval = getChatInterval() * 1000; // Convert to ms
            
            if (now - lastMessageTime < chatInterval) {
                 const remaining = Math.ceil((chatInterval - (now - lastMessageTime)) / 1000);
                 if (socket.readyState === 1) {
                     socket.send(JSON.stringify({ 
                         type: 'error', 
                         message: `Please wait ${remaining} seconds before sending another message.` 
                     }));
                 }
                 return;
            }

            connection.lastMessageTime = now;

            // Save to DB
            const stmt = db.prepare('INSERT INTO chat_messages (user_id, content, room) VALUES (?, ?, ?)');
            const result = stmt.run(connection.user.id, content, 'general');
            
            // Broadcast to all
            const msgObj = {
                id: result.lastInsertRowid,
                user_id: connection.user.id,
                username: connection.user.username,
                nickname: connection.user.nickname, // JWT payload might need nickname
                role: connection.user.role,
                content: content,
                created_at: Math.floor(Date.now() / 1000),
                room: 'general'
            };

            broadcast({ type: 'message', data: msgObj });
        }

      } catch (e) {
        console.error('WebSocket error:', e);
      }
    });

    socket.on('close', () => {
      clients.delete(connection);
      if (connection.user) {
         broadcast({ type: 'system_leave', user: connection.user.nickname || connection.user.username });
         broadcastOnlineUsers();
      }
    });
    
    socket.on('error', (err) => {
        console.error('WebSocket connection error:', err);
        clients.delete(connection);
    });
  });
}

function broadcastOnlineUsers() {
    const users = [];
    for (const client of clients) {
        if (client && client.user) {
            users.push({
                id: client.user.id,
                username: client.user.username,
                nickname: client.user.nickname,
                role: client.user.role
            });
        }
    }
    // Simple deduplication by ID
    const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values());
    
    broadcast({ type: 'users', data: uniqueUsers });
}

function broadcast(message) {
  for (const client of clients) {
    try {
      // Use the socket property if available, otherwise assume client is the socket
      const socket = client.socket || client;
      if (socket && socket.readyState === 1) { // OPEN
        socket.send(JSON.stringify(message));
      }
    } catch (e) {
      console.error('Broadcast error:', e);
    }
  }
}
