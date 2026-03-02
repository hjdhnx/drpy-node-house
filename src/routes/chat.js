import db from '../db.js';

const clients = new Set();

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
          socket.send(JSON.stringify({ type: 'history', data: history }));
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
            const user = fastify.jwt.verify(data.token);
            connection.user = user;
            // Broadcast user join?
            broadcast({ type: 'system', message: `${user.username} joined.` });
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

        if (data.type === 'message') {
            const content = data.content;
            if (!content) return;

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
         broadcast({ type: 'system', message: `${connection.user.username} left.` });
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
