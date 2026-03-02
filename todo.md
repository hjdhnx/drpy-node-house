# Todo List for Version 1.0.3

This document outlines the planned features and tasks for the 1.0.3 release, focusing on community features (Forum and Chat).

## 1. Database & Backend (SQLite + Fastify)

### 1.1 Database Schema Updates
- [ ] **Create `topics` table**
    - `id` (INTEGER PRIMARY KEY)
    - `title` (TEXT)
    - `content` (TEXT)
    - `user_id` (INTEGER, Foreign Key)
    - `created_at` (INTEGER)
    - `updated_at` (INTEGER)
    - `views` (INTEGER DEFAULT 0)
    - `is_pinned` (BOOLEAN DEFAULT 0)
- [ ] **Create `comments` table**
    - `id` (INTEGER PRIMARY KEY)
    - `topic_id` (INTEGER, Foreign Key)
    - `user_id` (INTEGER, Foreign Key)
    - `content` (TEXT)
    - `created_at` (INTEGER)
- [ ] **Create `chat_messages` table** (for history persistence)
    - `id` (INTEGER PRIMARY KEY)
    - `user_id` (INTEGER, Foreign Key)
    - `content` (TEXT)
    - `created_at` (INTEGER)
    - `room` (TEXT DEFAULT 'general')

### 1.2 Backend API Implementation
- [ ] **Forum Routes (`src/routes/forum.js`)**
    - `GET /api/forum/topics`: List topics with pagination.
    - `GET /api/forum/topics/:id`: Get single topic with comments.
    - `POST /api/forum/topics`: Create a new topic (Auth required).
    - `POST /api/forum/topics/:id/comments`: Add a comment to a topic (Auth required).
    - `DELETE /api/forum/topics/:id`: Delete a topic (Admin or Owner).
    - `DELETE /api/forum/comments/:id`: Delete a comment (Admin or Owner).
- [ ] **Chat WebSocket Server (`src/routes/chat.js`)**
    - Install `@fastify/websocket`.
    - Implement WebSocket route `/ws/chat`.
    - Handle authentication (JWT) for WebSocket connections.
    - Implement message broadcasting to connected clients.
    - Implement "Online Users" tracking.
    - (Optional) Implement persistent message history retrieval.

## 2. Frontend Implementation (Vue 3 + Tailwind CSS)

### 2.1 Architecture & Navigation
- [ ] **Refactor `index.html` layout**
    - Introduce a "View Switcher" (Files | Forum | Chat).
    - Add navigation tabs/links to the Navbar for easy switching.
    - Ensure authentication state is shared across views.

### 2.2 Forum Feature (New Page/View)
- [ ] **Topic List View**
    - Display list of topics with title, author, date, and comment count.
    - "New Topic" button (triggers modal or navigate to create view).
    - Pagination support.
- [ ] **Topic Detail View**
    - Display full topic content.
    - List comments below the topic.
    - "Reply" form at the bottom.
- [ ] **Create Topic Interface**
    - Simple form with Title and Content inputs.
    - Markdown support (optional, start with plain text/textarea).

### 2.3 Real-time Chat Feature
- [ ] **Chat Interface Component**
    - Message history area (scrollable).
    - Message input area (text + send button).
    - Online users list (sidebar or drawer).
- [ ] **WebSocket Client Integration**
    - Connect to `/ws/chat` on component mount (or app start if logged in).
    - Handle incoming messages and append to chat history.
    - Handle connection status (Connecting, Connected, Disconnected).
    - Auto-reconnect logic.

### 2.4 Responsive Design (Mobile & PC)
- [ ] **Mobile Layout**
    - **Forum**: Stacked layout, simplified list items.
    - **Chat**: Full-screen chat interface, hidden online user list (toggleable).
    - **Navigation**: Bottom tab bar or Hamburger menu for switching views.
- [ ] **PC Layout**
    - **Forum**: Standard table or card layout.
    - **Chat**: Fixed height window or sidebar integration.

## 3. Integration & Testing
- [ ] **Integration**
    - Ensure "Files" view remains the default homepage.
    - Verify role-based access control (only logged-in users can post/chat).
- [ ] **Testing**
    - Test WebSocket connection stability.
    - Test Forum pagination and search (if added).
    - Verify mobile responsiveness on various screen sizes.
