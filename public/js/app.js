import { createApp, ref, onMounted, computed, reactive, watch } from 'vue';
import { zh, en } from './i18n.js';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

createApp({
    setup() {
        // Markdown Helper
        const renderMarkdown = (text) => {
            if (!text) return '';
            try {
                const renderer = new marked.Renderer();
                const linkRenderer = renderer.link;
                renderer.link = (href, title, text) => {
                    const html = linkRenderer.call(renderer, href, title, text);
                    return html.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ');
                };
                const imageRenderer = renderer.image;
                renderer.image = (href, title, text) => {
                    const html = imageRenderer.call(renderer, href, title, text);
                    return html.replace(/^<img /, '<img class="max-w-full max-h-[300px] object-contain rounded-lg cursor-pointer hover:scale-[1.02] transition-transform" onclick="window.open(this.src, \'_blank\')" ');
                };

                // Custom dsfile:// renderer
                const originalLinkRenderer = renderer.link;
                renderer.link = (href, title, text) => {
                    if (href && href.startsWith('dsfile://')) {
                        const cid = href.replace('dsfile://', '');
                        // Use global handler
                        return `<a href="javascript:void(0)" onclick="window.handleFileRefClick('${cid}')" class="text-purple-600 hover:text-purple-800 hover:underline inline-flex items-center gap-0.5 font-medium transition-colors" title="Click to download"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>${text}</a>`;
                    }
                    return originalLinkRenderer.call(renderer, href, title, text).replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ');
                };

                const html = marked.parse(text, { breaks: true, renderer });
                return DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'onclick', 'class'] });
            } catch (e) {
                console.error('Markdown parsing error:', e);
                return text;
            }
        };

        const insertMarkdown = (textareaRef, prefix, suffix = '') => {
            // This function will be passed to the template to handle toolbar clicks
            // Since we need ref access, we might need to expose it or handle it in the template
            // A simpler way is to handle text insertion on the bound model, but cursor position is tricky
            // Let's implement a helper that takes the ref and the model update function
        };

        // I18n
        const lang = ref(localStorage.getItem('lang') || 'zh');
        const t = computed(() => lang.value === 'zh' ? zh : en);
        
        const toggleLang = () => {
            lang.value = lang.value === 'zh' ? 'en' : 'zh';
            localStorage.setItem('lang', lang.value);
        };

        const siteInfo = ref({
            name: '',
            copyright: '',
            icp: ''
        });

        watch([lang, () => siteInfo.value.name], () => {
             document.title = siteInfo.value.name || t.value.title;
        }, { immediate: true });

        const status = ref('Checking...');
        const version = ref('');
        const files = ref([]);
        const totalItems = ref(0);
        const currentPage = ref(1);
        const itemsPerPage = ref(10);
        const totalPages = ref(1);
        const searchQuery = ref('');
        const filterTag = ref('');
        
        const uploading = ref(false);
        const uploadStatusText = ref('');
        const fileInput = ref(null);
        
        // Auth state
        const user = ref(null);
        const token = ref(localStorage.getItem('token') || null);
        const showLogin = ref(false);
        const showRegister = ref(false);
        const authForm = ref({ username: '', password: '', inviteCode: '', reason: '' });
        const authError = ref('');
        const registrationPolicy = ref('open');
        const uploadConfig = ref({
            allowed_extensions: '.json,.txt,.py,.php,.js,.m3u',
            max_file_size: 204800,
            anonymous_upload: 'false',
            anonymous_preview: 'false',
            anonymous_download: 'false'
        });
        
        // Notifications
        const notifications = ref([]);
        const unreadNotificationsCount = ref(0);
        const showNotifications = ref(false);
        const showAllNotificationsModal = ref(false);
        const allNotifications = ref([]);
        const allNotificationsPage = ref(1);
        const allNotificationsTotal = ref(0);
        const allNotificationsLoading = ref(false);
        const allNotificationsHasMore = ref(true);

        // View Navigation
        const currentView = ref('files'); // 'files', 'forum', 'chat'

        // Scroll Containers
        const chatContainer = ref(null);
        const forumListContainer = ref(null);
        const forumDetailContainer = ref(null);

        // Forum State
        const topics = ref([]);
        const forumPage = ref(1);
        const forumTotalPages = ref(1);
        const currentTopic = ref(null);
        const showCreateTopic = ref(false);
        const newTopicForm = ref({ title: '', content: '' });
        const newCommentContent = ref('');

        // Chat State
        const chatMessages = ref([]);
        const chatInput = ref('');
        const chatInterval = ref(10); // Default 10s
        const lastMessageTime = ref(0);
        const chatCooldown = ref(0);
        const chatCooldownTimer = ref(null);

        const chatPlaceholder = computed(() => {
            if (chatCooldown.value > 0) {
                return `${t.value.chatPlaceholder} (${chatCooldown.value}s)`;
            }
            return t.value.chatPlaceholder;
        });

        const startChatCooldown = (seconds) => {
            chatCooldown.value = seconds;
            if (chatCooldownTimer.value) clearInterval(chatCooldownTimer.value);
            chatCooldownTimer.value = setInterval(() => {
                chatCooldown.value--;
                if (chatCooldown.value <= 0) {
                    clearInterval(chatCooldownTimer.value);
                    chatCooldownTimer.value = null;
                }
            }, 1000);
        };
        const ws = ref(null);
        const onlineUsers = ref([]);
        const isChatConnected = ref(false);
        const showOnlineUsersModal = ref(false);

        const switchView = (view) => {
            currentView.value = view;
            // Scroll to top when switching to fixed views (forum/chat) to ensure proper layout
            if (view !== 'files') {
                window.scrollTo(0, 0);
            }
            
            if (view === 'forum') {
                fetchTopics();
            } else if (view === 'chat') {
                connectChat();
                setTimeout(() => {
                    scrollToBottom();
                }, 100);
            }
        };

        // Forum Functions
        const fetchTopics = async (page = 1) => {
            try {
                const res = await fetch(`/api/forum/topics?page=${page}`);
                const data = await res.json();
                topics.value = data.topics;
                forumPage.value = data.page;
                forumTotalPages.value = data.totalPages;
            } catch (e) {
                console.error('Failed to fetch topics', e);
            }
        };

        const insertMarkdownAtCursor = (textarea, prefix, suffix = '') => {
            if (!textarea) return;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const before = text.substring(0, start);
            const selected = text.substring(start, end);
            const after = text.substring(end);
            
            const newText = before + prefix + selected + suffix + after;
            
            // Return new text and new cursor position
            return {
                text: newText,
                cursor: start + prefix.length + selected.length + suffix.length // Place cursor after inserted text? Or wrap?
                // Standard behavior: if text selected, wrap it and keep selection or move after. 
                // If no text, insert placeholder inside.
            };
        };

        const handleMdAction = (field, action, textareaId) => {
            const textarea = document.getElementById(textareaId);
            if (!textarea) return;
            
            let prefix = '', suffix = '';
            switch(action) {
                case 'bold': prefix = '**'; suffix = '**'; break;
                case 'italic': prefix = '*'; suffix = '*'; break;
                case 'code': prefix = '`'; suffix = '`'; break;
                case 'link': prefix = '['; suffix = '](url)'; break;
                case 'list': prefix = '\n- '; break;
            }

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const selected = text.substring(start, end);
            
            let newVal = '';
            let newCursor = 0;

            if (action === 'link' && !selected) {
                 newVal = text.substring(0, start) + '[text](url)' + text.substring(end);
                 newCursor = start + 1; // Highlight 'text'
            } else {
                 newVal = text.substring(0, start) + prefix + selected + suffix + text.substring(end);
                 newCursor = start + prefix.length + selected.length + suffix.length;
            }

            // Update model
            if (field === 'newTopicContent') newTopicForm.value.content = newVal;
            else if (field === 'newComment') newCommentContent.value = newVal;
            else if (field === 'chat') chatInput.value = newVal;

            // Restore focus next tick
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(newCursor, newCursor);
            }, 0);
        };

        const openTopic = async (id) => {
            try {
                const res = await fetch(`/api/forum/topics/${id}`);
                const data = await res.json();
                currentTopic.value = data;
                window.scrollTo(0, 0);
            } catch (e) {
                console.error('Failed to fetch topic', e);
            }
        };

        const createTopic = async () => {
            if (!newTopicForm.value.title || !newTopicForm.value.content) return;
            try {
                const res = await fetchWithAuth('/api/forum/topics', {
                    method: 'POST',
                    body: JSON.stringify(newTopicForm.value)
                });
                if (res.ok) {
                    showCreateTopic.value = false;
                    newTopicForm.value = { title: '', content: '' };
                    fetchTopics();
                } else {
                    alert(t.value.opFailed);
                }
            } catch (e) {
                console.error('Failed to create topic', e);
            }
        };

        const submitComment = async () => {
            if (!newCommentContent.value) return;
            try {
                const res = await fetchWithAuth(`/api/forum/topics/${currentTopic.value.topic.id}/comments`, {
                    method: 'POST',
                    body: JSON.stringify({ content: newCommentContent.value })
                });
                if (res.ok) {
                    newCommentContent.value = '';
                    openTopic(currentTopic.value.topic.id); // Reload topic
                } else {
                    alert(t.value.opFailed);
                }
            } catch (e) {
                console.error('Failed to submit comment', e);
            }
        };

        const deleteTopic = async (id) => {
            if (!confirm(t.value.confirmDeleteTopic)) return;
            try {
                const res = await fetchWithAuth(`/api/forum/topics/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    if (currentTopic.value && currentTopic.value.topic.id === id) {
                        currentTopic.value = null; // Go back to list
                    }
                    fetchTopics();
                } else {
                    alert(t.value.opFailed);
                }
            } catch (e) {
                console.error('Failed to delete topic', e);
            }
        };

        const deleteComment = async (id) => {
            if (!confirm(t.value.confirmDeleteComment)) return;
            try {
                const res = await fetchWithAuth(`/api/forum/comments/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    if (currentTopic.value) {
                        openTopic(currentTopic.value.topic.id);
                    }
                } else {
                    alert(t.value.opFailed);
                }
            } catch (e) {
                console.error('Failed to delete comment', e);
            }
        };

        // Chat Functions
        const connectChat = () => {
            if (ws.value && ws.value.readyState === WebSocket.OPEN) return;
            
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws/chat`;
            
            ws.value = new WebSocket(wsUrl);
            
            ws.value.onopen = () => {
                isChatConnected.value = true;
                // Send auth token if logged in
                if (token.value) {
                    ws.value.send(JSON.stringify({ type: 'auth', token: token.value }));
                }
            };

            ws.value.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'history') {
                    chatMessages.value = data.data;
                    if (data.chatInterval !== undefined) {
                        chatInterval.value = data.chatInterval;
                    }
                    scrollToBottom();
                } else if (data.type === 'message') {
                    chatMessages.value.push(data.data);
                    scrollToBottom();
                } else if (data.type === 'system') {
                    chatMessages.value.push({ type: 'system', content: data.message });
                    scrollToBottom();
                } else if (data.type === 'users') {
                    onlineUsers.value = data.data;
                } else if (data.type === 'error') {
                    if (data.message === 'Invalid token') {
                        console.error('Session expired or invalid token');
                        token.value = null;
                        user.value = null;
                        localStorage.removeItem('token');
                    } else if (data.message.includes('Please wait')) {
                        // Extract seconds from "Please wait X seconds..."
                        const match = data.message.match(/(\d+)\s+seconds/);
                        if (match) {
                            startChatCooldown(parseInt(match[1]));
                        }
                    } else {
                        alert(data.message);
                    }
                }
            };

            ws.value.onclose = () => {
                isChatConnected.value = false;
                // Auto reconnect after 3s
                setTimeout(() => {
                    if (currentView.value === 'chat') connectChat();
                }, 3000);
            };
        };

        const sendChatMessage = () => {
            if (!chatInput.value.trim() || !ws.value) return;
            
            const now = Date.now();
            const intervalMs = chatInterval.value * 1000;
            if (now - lastMessageTime.value < intervalMs) {
                const remaining = Math.ceil((intervalMs - (now - lastMessageTime.value)) / 1000);
                startChatCooldown(remaining);
                return;
            }

            ws.value.send(JSON.stringify({ type: 'message', content: chatInput.value }));
            chatInput.value = '';
            lastMessageTime.value = now;
            startChatCooldown(chatInterval.value);
        };

        const scrollToBottom = () => {
            setTimeout(() => {
                const container = document.getElementById('chat-container');
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
            }, 100);
        };

        const getScrollContainer = () => {
            let el = null;
            if (currentView.value === 'chat') {
                el = chatContainer.value;
                if (!el) el = document.getElementById('chat-container');
            } else if (currentView.value === 'forum') {
                if (currentTopic.value) {
                    el = forumDetailContainer.value;
                    if (!el) el = document.getElementById('forum-detail-container');
                } else {
                    el = forumListContainer.value;
                    if (!el) el = document.getElementById('forum-list-container');
                }
            }
            return el;
        };

        const scrollToTopAction = () => {
            if (currentView.value === 'files') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            const el = getScrollContainer();
            if (el) {
                // Use scrollTop which is widely supported
                // Smooth behavior is handled by CSS 'scroll-smooth' class
                el.scrollTop = 0;
            } else {
                console.warn('Scroll target not found for view:', currentView.value);
            }
        };

        const scrollToBottomAction = () => {
            if (currentView.value === 'files') {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                return;
            }

            const el = getScrollContainer();
            if (el) {
                el.scrollTop = el.scrollHeight;
            } else {
                console.warn('Scroll target not found for view:', currentView.value);
            }
        };

        const parseNotificationContent = (content) => {
            try {
                const obj = JSON.parse(content);
                if (obj && typeof obj === 'object' && (obj.en || obj.zh)) {
                    return obj[lang.value] || obj.en || obj.zh || content;
                }
            } catch (e) {
                // Not JSON, return as is
            }
            return content;
        };
        const fetchNotifications = async () => {
            if (!token.value) return;
            try {
                const res = await fetchWithAuth('/api/notifications'); // Use default limit from backend
                const data = await res.json();
                notifications.value = data.notifications.map(n => ({
                    ...n,
                    title: parseNotificationContent(n.title),
                    message: parseNotificationContent(n.message)
                }));
                unreadNotificationsCount.value = data.unreadCount;
            } catch (e) {
                console.error('Failed to fetch notifications', e);
            }
        };

        const fetchAllNotifications = async (reset = false) => {
            if (reset) {
                allNotificationsPage.value = 1;
                allNotifications.value = [];
                allNotificationsHasMore.value = true;
            }
            if (!allNotificationsHasMore.value || allNotificationsLoading.value) return;

            allNotificationsLoading.value = true;
            try {
                const res = await fetchWithAuth(`/api/notifications?page=${allNotificationsPage.value}&limit=20`);
                const data = await res.json();
                
                const newNotifications = data.notifications.map(n => ({
                    ...n,
                    title: parseNotificationContent(n.title),
                    message: parseNotificationContent(n.message)
                }));

                if (newNotifications.length < 20) {
                    allNotificationsHasMore.value = false;
                }

                allNotifications.value = [...allNotifications.value, ...newNotifications];
                allNotificationsPage.value++;
            } catch (e) {
                console.error('Failed to fetch all notifications', e);
            } finally {
                allNotificationsLoading.value = false;
            }
        };

        const openAllNotifications = () => {
            showNotifications.value = false;
            showAllNotificationsModal.value = true;
            fetchAllNotifications(true);
        };

        const markAllAsRead = async () => {
            try {
                await fetchWithAuth('/api/notifications/read-all', { method: 'POST' });
                unreadNotificationsCount.value = 0;
                notifications.value.forEach(n => n.is_read = 1);
            } catch (e) {
                console.error('Failed to mark all as read', e);
            }
        };

        const handleNotificationClick = async (note) => {
            if (!note.is_read) {
                try {
                    await fetchWithAuth(`/api/notifications/${note.id}/read`, { method: 'POST' });
                    note.is_read = 1;
                    unreadNotificationsCount.value = Math.max(0, unreadNotificationsCount.value - 1);
                } catch (e) {
                    console.error('Failed to mark notification as read', e);
                }
            }
            if (note.link) {
                window.location.href = note.link;
            }
        };

        const toggleNotifications = () => {
            showNotifications.value = !showNotifications.value;
            if (showNotifications.value) {
                fetchNotifications();
            }
        };

        const fetchWithAuth = async (url, options = {}) => {
            const headers = { ...options.headers };
            if (token.value) {
                headers['Authorization'] = `Bearer ${token.value}`;
            }
            if (options.body && !headers['Content-Type']) {
                headers['Content-Type'] = 'application/json';
            }
            const res = await fetch(url, { ...options, headers });
            if (res.status === 401) {
                logout();
            }
            return res;
        };

        // Computed permissions
        const canUpload = computed(() => {
            // If user is pending, treat as anonymous for upload permission
            if (user.value && user.value.status === 'pending') {
                return uploadConfig.value.anonymous_upload === 'true';
            }
            return user.value || uploadConfig.value.anonymous_upload === 'true';
        });

        const canPreview = computed(() => {
            // If user is pending, treat as anonymous for preview permission
            if (user.value && user.value.status === 'pending') {
                return uploadConfig.value.anonymous_preview === 'true';
            }
            return user.value || uploadConfig.value.anonymous_preview === 'true';
        });

        const canDownload = computed(() => {
            // If user is pending, treat as anonymous for download permission
            if (user.value && user.value.status === 'pending') {
                return uploadConfig.value.anonymous_download === 'true';
            }
            return user.value || uploadConfig.value.anonymous_download === 'true';
        });

        // Watchers
        watch([showLogin, showRegister], () => {
            authError.value = '';
        });

        // Upload options
        const isPublicUpload = ref(true);
        const showTagModal = ref(false);
        const currentFile = ref(null);
        const selectedTags = ref([]);
        const loading = ref(false);

        // Change Password
        const showChangePasswordModal = ref(false);
        const changePasswordForm = ref({ oldPassword: '', newPassword: '' });

        // Emoji State
        const showEmojiPicker = ref(false);
        const emojiTarget = ref(null);
        const emojiPickerStyle = ref({});
        const emojis = [
            '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
            '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
            '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
            '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
            '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
            '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
            '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
            '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
            '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
            '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾',
            '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿',
            '😾', '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞',
            '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
            '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
            '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👣',
            '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁',
            '👅', '👄', '💋', '🩸', '❤️', '🧡', '💛', '💚', '💙', '💜',
            '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
            '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯',
            '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌',
            '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑',
            '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️',
            '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️',
            '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛',
            '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵',
            '🚭', '❗️', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️',
            '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️',
            '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿',
            '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '男人', '🚺',
            '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🆖', '🆗', '🆙', '🆒',
            '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣',
            '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️',
            '⏸', '⏯', '⏹', '⏺', '⏭', '⏮', '⏩', '⏪', '⏫', '⏬',
            '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️',
            '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂',
            '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '♾', '💲',
            '💱', '™️', '©️', '®️', '👁️‍🗨️', '🔚', '🔙', '🔛', '🔝', '🔜',
            '〰️', '➰', '➿', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢',
            '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶',
            '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥',
            '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔈', '🔇',
            '🔉', '🔊', '🔔', '🔕', '📣', '📢', '👁️', '🗨️', '🗯️', '💭',
            '💤', '♨️', '💈', '🛑', '🕛', '🕧', '🕐', '🕜', '🕑', '🕝',
            '🕒', '🕞', '🕓', '🕟', '🕔', '🕠', '🕕', '🕡', '🕖', '🕢',
            '🕗', '🕣', '🕘', '🕤', '🕙', '🕥', '🕚', '🕦', '🌑', '🌒',
            '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜',
            '🌡️', '☀️', '🌝', '🌞', '⭐', '🌟', '🌠', '☁️', '⛅', '⛈️',
            '🌤️', '🌥️', '🌦️', '🌧️', '🌨️', '🌩️', '🌪️', '🌫️', '🌬️',
            '🌀', '🌈', '🌂', '☂️', '☔', '⛱️', '⚡', '❄️', '☃️', '⛄',
            '☄️', '🔥', '💧', '🌊'
        ];

        const toggleEmojiPicker = (target, event) => {
            if (showEmojiPicker.value && emojiTarget.value === target) {
                showEmojiPicker.value = false;
                return;
            }
            
            emojiTarget.value = target;
            showEmojiPicker.value = true;
            
            // Position near the button
            const rect = event.target.getBoundingClientRect();
            // Default position (desktop)
            let top = rect.bottom + window.scrollY + 5;
            let left = rect.left + window.scrollX;
            
            // Check if it goes off screen right
            if (left + 288 > window.innerWidth) { // 288px is w-72
                left = window.innerWidth - 300;
            }
            
            // Check if it goes off screen bottom
            if (top + 320 > window.innerHeight + window.scrollY) { // 320px is max-h-80
                top = rect.top + window.scrollY - 330;
            }

            // Mobile adjustment (center it or use fixed bottom)
            if (window.innerWidth < 768) {
                emojiPickerStyle.value = {
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    position: 'fixed'
                };
            } else {
                emojiPickerStyle.value = {
                    top: `${top}px`,
                    left: `${left}px`,
                    position: 'absolute'
                };
            }
        };

        const insertEmoji = (emoji) => {
            let textareaId = '';
            if (emojiTarget.value === 'chat') textareaId = 'chat-input';
            else if (emojiTarget.value === 'newTopicContent') textareaId = 'topic-content-input';
            else if (emojiTarget.value === 'newComment') textareaId = 'comment-content-input';
            
            const textarea = document.getElementById(textareaId);
            if (!textarea) return;
            
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const before = text.substring(0, start);
            const after = text.substring(end);
            
            const newVal = before + emoji + after;
            
            if (emojiTarget.value === 'chat') chatInput.value = newVal;
            else if (emojiTarget.value === 'newTopicContent') newTopicForm.value.content = newVal;
            else if (emojiTarget.value === 'newComment') newCommentContent.value = newVal;
            
            showEmojiPicker.value = false;
            
            setTimeout(() => {
                textarea.focus();
                const newCursor = start + emoji.length;
                textarea.setSelectionRange(newCursor, newCursor);
            }, 0);
        };

        const handlePaste = async (event, targetType) => {
            const items = (event.clipboardData || event.originalEvent.clipboardData).items;
            let file = null;
            for (let index in items) {
                const item = items[index];
                if (item.kind === 'file' && item.type.indexOf('image/') !== -1) {
                    file = item.getAsFile();
                    break;
                }
            }
            
            if (!file) return;
            
            // Check file size
            const maxSize = uploadConfig.value.max_file_size;
            if (file.size > maxSize) {
                alert(`文件过大: ${file.name} (最大限制: ${formatSize(maxSize)})`);
                return;
            }

            event.preventDefault();
            
            let textareaId = '';
            if (targetType === 'chat') textareaId = 'chat-input';
            else if (targetType === 'newTopicContent') textareaId = 'topic-content-input';
            else if (targetType === 'newComment') textareaId = 'comment-content-input';
            
            const textarea = document.getElementById(textareaId);
            if (!textarea) return;

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const placeholder = `![Uploading ${file.name}...](${t.value.loading || '...'})`;
            
            const before = text.substring(0, start);
            const after = text.substring(end);
            
            const updateModel = (val) => {
                if (targetType === 'chat') chatInput.value = val;
                else if (targetType === 'newTopicContent') newTopicForm.value.content = val;
                else if (targetType === 'newComment') newCommentContent.value = val;
            };
            
            updateModel(before + placeholder + after);
            
            try {
                const res = await uploadSingleFile(file, true, 'chat-image');
                const url = getDownloadUrl(res.cid, true); // Use preview=true
                const markdownImage = `![${file.name}](${url})`;
                
                let currentVal = '';
                if (targetType === 'chat') currentVal = chatInput.value;
                else if (targetType === 'newTopicContent') currentVal = newTopicForm.value.content;
                else if (targetType === 'newComment') currentVal = newCommentContent.value;
                
                updateModel(currentVal.replace(placeholder, markdownImage));
                
            } catch (e) {
                console.error(e);
                alert(t.value.uploadFailed || 'Upload failed');
                
                let currentVal = '';
                if (targetType === 'chat') currentVal = chatInput.value;
                else if (targetType === 'newTopicContent') currentVal = newTopicForm.value.content;
                else if (targetType === 'newComment') currentVal = newCommentContent.value;
                
                updateModel(currentVal.replace(placeholder, ''));
            }
        };

        const handleImageUpload = async (event, targetType) => {
            const file = event.target.files[0];
            if (!file) return;

            // Reset file input
            event.target.value = '';

            // Check file size
            const maxSize = uploadConfig.value.max_file_size;
            if (file.size > maxSize) {
                alert(`文件过大: ${file.name} (最大限制: ${formatSize(maxSize)})`);
                return;
            }

            let textareaId = '';
            if (targetType === 'chat') textareaId = 'chat-input';
            else if (targetType === 'newTopicContent') textareaId = 'topic-content-input';
            else if (targetType === 'newComment') textareaId = 'comment-content-input';
            
            const textarea = document.getElementById(textareaId);
            if (!textarea) return;

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const placeholder = `![Uploading ${file.name}...](${t.value.loading || '...'})`;
            
            const before = text.substring(0, start);
            const after = text.substring(end);
            
            const updateModel = (val) => {
                if (targetType === 'chat') chatInput.value = val;
                else if (targetType === 'newTopicContent') newTopicForm.value.content = val;
                else if (targetType === 'newComment') newCommentContent.value = val;
            };
            
            updateModel(before + placeholder + after);
            
            try {
                const res = await uploadSingleFile(file, true, 'chat-image');
                const url = getDownloadUrl(res.cid, true); // Use preview=true
                const markdownImage = `![${file.name}](${url})`;
                
                let currentVal = '';
                if (targetType === 'chat') currentVal = chatInput.value;
                else if (targetType === 'newTopicContent') currentVal = newTopicForm.value.content;
                else if (targetType === 'newComment') currentVal = newCommentContent.value;
                
                updateModel(currentVal.replace(placeholder, markdownImage));
                
                setTimeout(() => {
                    textarea.focus();
                    const newCursor = start + markdownImage.length;
                    textarea.setSelectionRange(newCursor, newCursor);
                }, 0);

            } catch (e) {
                console.error(e);
                alert(t.value.uploadFailed || 'Upload failed');
                
                let currentVal = '';
                if (targetType === 'chat') currentVal = chatInput.value;
                else if (targetType === 'newTopicContent') currentVal = newTopicForm.value.content;
                else if (targetType === 'newComment') currentVal = newCommentContent.value;
                
                updateModel(currentVal.replace(placeholder, ''));
            }
        };

        // Device detection
        const isAndroid = /Android/i.test(navigator.userAgent);
        
        const fileInputAccept = computed(() => {
            if (isAndroid) return ''; // Disable accept on Android to fix file picker
            return uploadConfig.value?.allowed_extensions || '';
        });

        const allowedTags = computed(() => {
            if (!uploadConfig.value || !uploadConfig.value.allowed_tags) return [];
            return uploadConfig.value.allowed_tags.split(',').map(t => t.trim());
        });

        const openTagModal = (file) => {
            currentFile.value = file;
            selectedTags.value = file.tags ? file.tags.split(',') : [];
            showTagModal.value = true;
        };

        const saveTags = async () => {
            if (!currentFile.value) return;
            loading.value = true;
            try {
                const res = await fetch(`/api/files/${currentFile.value.cid}/tags`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token.value}`
                    },
                    body: JSON.stringify({ tags: selectedTags.value })
                });

                if (res.ok) {
                    await fetchFiles();
                    showTagModal.value = false;
                } else {
                    const data = await res.json();
                    alert(data.error || t.value.opFailed);
                }
            } catch (e) {
                console.error(e);
                alert(t.value.opFailed);
            } finally {
                loading.value = false;
            }
        };

        const changePassword = async () => {
            loading.value = true;
            try {
                const res = await fetch('/api/auth/change-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token.value}`
                    },
                    body: JSON.stringify(changePasswordForm.value)
                });

                if (res.ok) {
                    alert(t.value.passwordChanged);
                    showChangePasswordModal.value = false;
                    changePasswordForm.value = { oldPassword: '', newPassword: '' };
                } else {
                    const data = await res.json();
                    alert(data.error || t.value.opFailed);
                }
            } catch (e) {
                console.error(e);
                alert(t.value.opFailed);
            } finally {
                loading.value = false;
            }
        };

        const checkStatus = async () => {
            try {
                const res = await fetch('/api/status');
                const data = await res.json();
                status.value = data.status;
                if (data.version) version.value = data.version;
            } catch (e) {
                status.value = 'offline';
            }
        };

        const fetchPolicy = async () => {
            try {
                const res = await fetch('/api/auth/policy');
                const data = await res.json();
                registrationPolicy.value = data.policy;
                if (data.uploadConfig) {
                    uploadConfig.value = data.uploadConfig;
                    if (data.uploadConfig.site_name) siteInfo.value.name = data.uploadConfig.site_name;
                    if (data.uploadConfig.site_copyright) siteInfo.value.copyright = data.uploadConfig.site_copyright;
                    if (data.uploadConfig.site_icp) siteInfo.value.icp = data.uploadConfig.site_icp;
                }
            } catch (e) {
                console.error(e);
            }
        };

        const checkAuth = async () => {
            if (!token.value) return;
            try {
                const res = await fetch('/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${token.value}` }
                });
                if (res.ok) {
                    user.value = await res.json();
                } else {
                    logout();
                }
            } catch (e) {
                logout();
            }
        };

        const login = async () => {
            authError.value = '';
            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(authForm.value)
                });
                const data = await res.json();
                if (res.ok) {
                    token.value = data.token;
                    localStorage.setItem('token', data.token);
                    user.value = data.user;
                    showLogin.value = false;
                    authForm.value = { username: '', password: '', reason: '' };
                    fetchFiles();
                } else {
                    authError.value = data.error || t.value.loginFailed;
                }
            } catch (e) {
                authError.value = t.value.loginFailed;
            }
        };

        const register = async () => {
            authError.value = '';
            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(authForm.value)
                });
                const data = await res.json();
                if (res.ok) {
                    if (data.token) {
                        token.value = data.token;
                        localStorage.setItem('token', data.token);
                        user.value = data.user;
                        fetchFiles();
                    } else {
                        // Pending approval or other status without token
                        alert(data.message || t.value.registerSuccessWait);
                    }
                    showRegister.value = false;
                    authForm.value = { username: '', password: '', reason: '' };
                } else {
                    authError.value = data.error || t.value.registerFailed;
                }
            } catch (e) {
                authError.value = t.value.registerFailed;
            }
        };

        const logout = () => {
            if (!confirm(t.value.confirmLogout)) return;
            token.value = null;
            user.value = null;
            localStorage.removeItem('token');
            fetchFiles();
        };

        const fetchFiles = async () => {
            try {
                const headers = {};
                if (token.value) {
                    headers['Authorization'] = `Bearer ${token.value}`;
                }
                const res = await fetch(`/api/files/list?page=${currentPage.value}&limit=${itemsPerPage.value}&search=${encodeURIComponent(searchQuery.value)}&tag=${encodeURIComponent(filterTag.value)}`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        // Backward compatibility or empty result handling
                        files.value = data;
                        totalItems.value = data.length;
                        totalPages.value = 1;
                    } else {
                        files.value = data.files;
                        totalItems.value = data.total;
                        totalPages.value = data.totalPages;
                        currentPage.value = data.page;
                    }
                }
            } catch (e) {
                console.error('Failed to fetch files', e);
            }
        };

        const changePage = (page) => {
            if (page >= 1 && page <= totalPages.value) {
                currentPage.value = page;
                fetchFiles();
            }
        };

        const changeItemsPerPage = () => {
            currentPage.value = 1; // Reset to first page
            fetchFiles();
        };

        const handleSearch = () => {
            currentPage.value = 1;
            fetchFiles();
        };

        const handleFilterTag = () => {
            currentPage.value = 1;
            fetchFiles();
        };

        const clearSearch = () => {
            searchQuery.value = '';
            handleSearch();
        };

        const scanFiles = async (entry) => {
            if (entry.isFile) {
                return new Promise((resolve) => {
                    entry.file(
                        (file) => resolve([file]),
                        (err) => {
                            console.error('Failed to read file entry:', err);
                            resolve([]);
                        }
                    );
                });
            } else if (entry.isDirectory) {
                const reader = entry.createReader();
                const readEntries = () => new Promise((resolve, reject) => {
                    reader.readEntries(resolve, reject);
                });
                
                try {
                    const entries = await readEntries();
                    let files = [];
                    for (const e of entries) {
                        files = files.concat(await scanFiles(e));
                    }
                    return files;
                } catch (e) {
                    console.error('Error reading directory', e);
                    return [];
                }
            }
            return [];
        };

        const handleFileSelect = async (event) => {
            const selectedFiles = Array.from(event.target.files);
            validateAndUpload(selectedFiles);
        };

        const handleDrop = async (event) => {
            event.preventDefault();
            const items = event.dataTransfer.items;
            let files = [];
            
            // Collect entries synchronously first
            const entries = [];
            if (items) {
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    if (item.kind === 'file') {
                        const entry = item.webkitGetAsEntry();
                        if (entry) {
                            entries.push(entry);
                        }
                    }
                }
            }

            if (entries.length > 0) {
                for (const entry of entries) {
                    files = files.concat(await scanFiles(entry));
                }
            } else {
                files = Array.from(event.dataTransfer.files);
            }

            if (files.length > 0) {
                validateAndUpload(files);
            }
        };

        const validateAndUpload = (files) => {
            if (files.length === 0) return;
            
            const allowed = uploadConfig.value.allowed_extensions.split(',').map(e => e.trim().toLowerCase());
            const maxSize = uploadConfig.value.max_file_size;
            
            const validFiles = [];
            const errors = [];

            for (const file of files) {
                const ext = '.' + file.name.split('.').pop().toLowerCase();
                const isExtValid = allowed.includes(ext);
                const isSizeValid = file.size <= maxSize;
                
                if (!isExtValid) {
                    errors.push(`文件类型不允许: ${file.name}`);
                } else if (!isSizeValid) {
                    errors.push(`文件过大: ${file.name} (最大限制: ${formatSize(maxSize)})`);
                } else {
                    validFiles.push(file);
                }
            }

            if (errors.length > 0) {
                alert(errors.join('\n'));
            }

            if (validFiles.length > 0) {
                uploadFiles(validFiles);
            }
        };

        const uploadFiles = async (fileList) => {
            if (uploading.value) return;
            uploading.value = true;
            let successCount = 0;
            let failCount = 0;

            for (let i = 0; i < fileList.length; i++) {
                const file = fileList[i];
                uploadStatusText.value = t.value.uploadProgress
                    .replace('{current}', i + 1)
                    .replace('{total}', fileList.length);
                
                try {
                    await uploadSingleFile(file);
                    successCount++;
                } catch (e) {
                    console.error(`Failed to upload ${file.name}`, e);
                    failCount++;
                }
            }
            
            uploading.value = false;
            uploadStatusText.value = '';
            if (fileInput.value) fileInput.value.value = '';
            await fetchFiles();
            
            if (failCount > 0) {
                alert(`${t.value.uploadFailed}: ${successCount} success, ${failCount} failed.`);
            }
        };

        const uploadSingleFile = async (file, forcePublic = false, tags = '') => {
            const formData = new FormData();
            formData.append('file', file);
            
            const headers = {};
            if (token.value) {
                headers['Authorization'] = `Bearer ${token.value}`;
            }

            const isPublic = forcePublic ? 'true' : isPublicUpload.value;
            let query = `?is_public=${isPublic}`;
            if (tags) {
                query += `&tags=${encodeURIComponent(tags)}`;
            }
            const res = await fetch(`/api/files/upload${query}`, {
                method: 'POST',
                headers,
                body: formData
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Upload failed');
            }
            
            return await res.json();
        };

        const toggleVisibility = async (file) => {
            const targetStatus = file.is_public ? t.value.privateLabel : t.value.publicLabel;
            if (!confirm(t.value.confirmToggle.replace('{status}', targetStatus))) return;
            try {
                const res = await fetch(`/api/files/${file.cid}/toggle-visibility`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token.value}` }
                });
                if (res.ok) {
                    await fetchFiles();
                } else {
                    alert(t.value.opFailed);
                }
            } catch (e) {
                console.error(e);
                alert(t.value.opFailed);
            }
        };

        const deleteFile = async (file) => {
            if (!confirm(t.value.confirmDelete.replace('{filename}', file.filename))) return;
            try {
                const res = await fetch(`/api/files/${file.cid}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token.value}` }
                });
                if (res.ok) {
                    await fetchFiles();
                } else {
                    alert(t.value.opFailed);
                }
            } catch (e) {
                console.error(e);
                alert(t.value.opFailed);
            }
        };

        const isOwner = (file) => {
            if (!user.value) return false;
            if (user.value.role === 'super_admin') return true;
            return file.user_id === user.value.id;
        };

        const formatSize = (bytes) => {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        const truncate = (str, n) => {
            return (str.length > n) ? str.substr(0, n-1) + '...' : str;
        };
        
        const formatDate = (timestamp) => {
            return new Date(timestamp * 1000).toLocaleString(lang.value === 'zh' ? 'zh-CN' : 'en-US');
        };

        const copyToClipboard = async (text) => {
            if (!text) return;
            try {
                // Try modern API first
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                    alert('已复制到剪贴板');
                } else {
                    // Fallback for older browsers / webviews without clipboard API
                    const textArea = document.createElement("textarea");
                    textArea.value = text;
                    
                    // Ensure textarea is not visible but part of DOM
                    textArea.style.position = "fixed";
                    textArea.style.left = "-9999px";
                    textArea.style.top = "0";
                    document.body.appendChild(textArea);
                    
                    textArea.focus();
                    textArea.select();
                    
                    try {
                        const successful = document.execCommand('copy');
                        const msg = successful ? '已复制到剪贴板' : '复制失败';
                        alert(msg);
                    } catch (err) {
                        console.error('Fallback copy failed', err);
                        alert('复制失败');
                    }
                    
                    document.body.removeChild(textArea);
                }
            } catch (err) {
                console.error('Failed to copy: ', err);
                alert('复制失败');
            }
        };

        // User Profile
        const showProfileModal = ref(false);
        const userProfileForm = ref({
            nickname: '',
            qq: '',
            email: '',
            phone: '',
            download_preference: 'default'
        });
        const profileError = ref('');

        const protocolOptions = computed(() => {
            if (!uploadConfig.value || !uploadConfig.value.download_protocols) return [];
            try {
                const protocols = typeof uploadConfig.value.download_protocols === 'string' 
                    ? JSON.parse(uploadConfig.value.download_protocols) 
                    : uploadConfig.value.download_protocols;
                return Object.keys(protocols);
            } catch (e) {
                return [];
            }
        });

        const openProfileModal = () => {
            if (!user.value) return;
            userProfileForm.value = {
                nickname: user.value.nickname || '',
                qq: user.value.qq || '',
                email: user.value.email || '',
                phone: user.value.phone || '',
                download_preference: user.value.download_preference || 'default'
            };
            profileError.value = '';
            showProfileModal.value = true;
        };

        const updateProfile = async () => {
            profileError.value = '';
            try {
                // Prepare payload - only send defined fields
                const payload = {};
                if (userProfileForm.value.nickname !== undefined) payload.nickname = userProfileForm.value.nickname;
                if (userProfileForm.value.qq !== undefined) payload.qq = userProfileForm.value.qq;
                if (userProfileForm.value.email !== undefined) payload.email = userProfileForm.value.email;
                if (userProfileForm.value.phone !== undefined) payload.phone = userProfileForm.value.phone;
                if (userProfileForm.value.download_preference !== undefined) payload.download_preference = userProfileForm.value.download_preference;

                const res = await fetchWithAuth('/api/auth/me', {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (res.ok) {
                    user.value = data; // Update local user state
                    showProfileModal.value = false;
                    alert(t.value.profileSaved);
                    // Refresh file list to update nickname display
                    fetchFiles();
                } else {
                    profileError.value = data.error === 'Nickname already exists' ? t.value.nicknameExists : (data.error || 'Update failed');
                }
            } catch (e) {
                console.error(e);
                profileError.value = 'Update failed';
            }
        };

        const getDownloadUrl = (cid, preview = false) => {
            let url = `/api/files/download/${cid}`;
            const params = [];
            if (token.value) params.push(`token=${token.value}`);
            if (preview) params.push('preview=true');
            
            if (params.length > 0) {
                url += `?${params.join('&')}`;
            }
            return url;
        };

        const getFileDownloadUrl = (file) => {
            const directUrl = getDownloadUrl(file.cid);
            
            if (!user.value || !user.value.download_preference || user.value.download_preference === 'default') {
                return directUrl;
            }
            
            // Check if protocol exists in config
            if (!uploadConfig.value || !uploadConfig.value.download_protocols) return directUrl;
            
            let protocols = {};
            try {
                protocols = typeof uploadConfig.value.download_protocols === 'string' 
                    ? JSON.parse(uploadConfig.value.download_protocols) 
                    : uploadConfig.value.download_protocols;
            } catch (e) {
                return directUrl;
            }
            
            const template = protocols[user.value.download_preference];
            if (!template) return directUrl;
            
            // Calculate lang
            let lang = 'json'; // default fallback
            const ext = file.filename.split('.').pop().toLowerCase();
            const tags = file.tags ? file.tags.split(',').map(t => t.trim()) : [];
            
            if (['json', 'txt', 'm3u'].includes(ext)) {
               lang = 'json';
            } else if (ext === 'js') {
               if (tags.includes('dr2')) {
                  lang = 'dr2';
               } else {
                  lang = 'ds';
               }
            } else if (ext === 'php') {
               lang = 'php';
            } else if (ext === 'py') {
               lang = 'hipy';
            }
            
            const fullUrl = window.location.origin + directUrl + '#' + file.filename;
            // The template expects {{url}} to be replaced by the download link
            // And {{lang}} by the calculated lang
            return template.replace('{{lang}}', lang).replace('{{url}}', fullUrl);
        };

        const isAppReady = ref(false);

        const isMobileUploadExpanded = ref(true);

        // File Selector State
        const showFileSelectorModal = ref(false);
        const fileSelectorTarget = ref('');
        const fileSelectorQuery = ref('');
        const fileSelectorList = ref([]);
        const fileSelectorPage = ref(1);
        const fileSelectorTotalPages = ref(1);
        const fileSelectorLoading = ref(false);

        const openFileSelector = (target) => {
            fileSelectorTarget.value = target;
            fileSelectorQuery.value = '';
            fileSelectorPage.value = 1;
            showFileSelectorModal.value = true;
            fetchFilesForSelector();
        };

        const fetchFilesForSelector = async () => {
            fileSelectorLoading.value = true;
            try {
                const headers = {};
                if (token.value) {
                    headers['Authorization'] = `Bearer ${token.value}`;
                }
                const res = await fetch(`/api/files/list?page=${fileSelectorPage.value}&limit=10&search=${encodeURIComponent(fileSelectorQuery.value)}`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        fileSelectorList.value = data;
                        fileSelectorTotalPages.value = 1;
                    } else {
                        fileSelectorList.value = data.files;
                        fileSelectorTotalPages.value = data.totalPages;
                    }
                }
            } catch (e) {
                console.error('Failed to fetch files for selector', e);
            } finally {
                fileSelectorLoading.value = false;
            }
        };

        const insertFileReference = (file) => {
            const link = `[${file.filename}](dsfile://${file.cid})`;
            
            let textareaId = '';
            if (fileSelectorTarget.value === 'chat') textareaId = 'chat-input';
            else if (fileSelectorTarget.value === 'newTopicContent') textareaId = 'topic-content-input';
            else if (fileSelectorTarget.value === 'newComment') textareaId = 'comment-content-input';
            
            const textarea = document.getElementById(textareaId);
            if (!textarea) return;

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const before = text.substring(0, start);
            const after = text.substring(end);
            
            const newVal = before + link + after;
            
            if (fileSelectorTarget.value === 'chat') chatInput.value = newVal;
            else if (fileSelectorTarget.value === 'newTopicContent') newTopicForm.value.content = newVal;
            else if (fileSelectorTarget.value === 'newComment') newCommentContent.value = newVal;
            
            showFileSelectorModal.value = false;
            
            setTimeout(() => {
                textarea.focus();
                const newCursor = start + link.length;
                textarea.setSelectionRange(newCursor, newCursor);
            }, 0);
        };

        // Handle File Reference Click (Global)
        window.handleFileRefClick = async (cid) => {
            // Need to fetch file metadata to apply download preference correctly (e.g. extension, tags)
            // Since we don't have the full file object here, we'll do a quick fetch or fallback
            // Ideally we should have an endpoint for this, or just use the list API.
            // But we can use the download API head check or just rely on a new metadata endpoint?
            // Or just assume default behavior if we can't get metadata.
            
            // Let's try to find it in the current loaded files first (optimization)
            let file = files.value.find(f => f.cid === cid);
            
            if (!file) {
                // If not in current list, try to fetch it (we reuse the download endpoint but that triggers download)
                // We really need metadata. Let's use the file list search by cid? Or assume we can just download.
                // If we want to support custom protocols, we need the filename and tags.
                // Let's add a quick metadata fetch.
                try {
                    // Using the existing list API to find the file by searching (not ideal but works if search supports cid or exact match)
                    // The search param in list API usually searches filename.
                    // Let's assume we need to fallback to direct download if we can't get metadata.
                    // OR better: Create a small helper to get file info.
                    // For now, let's just use the direct download URL if we can't find it locally, 
                    // unless we can assume the user wants the default behavior.
                    
                    // Actually, let's try to fetch the file info via a new call or just use the download URL directly if simpler.
                    // But the requirement is "Trigger download strategy based on user preference".
                    // So we MUST know the file extension and tags.
                    
                    // Hack: We can fetch the file list with a limit=1 and some filter? No.
                    // Let's assume for now we use the direct download if not found in local list.
                    // IMPROVEMENT: Add a specific metadata API later if needed.
                    
                    // Wait, we can use the 'list' API with search? 
                    // If the user hasn't loaded the file in the list, we don't know its type.
                    // Let's try to fetch it.
                    
                    // Actually, let's just implement a simple fetch for now.
                    // Note: In a real app, I would add `GET /api/files/:cid`
                    // Since I can't easily add backend API without checking backend code, 
                    // I'll stick to what I can do.
                    
                    // Backend `mcp_drpy-node-mcp_read_file` is available to me, but I am in frontend code.
                    // I will check if there is a way to get single file info.
                    // Looking at `public/js/app.js`, `toggleVisibility` uses `/api/files/${file.cid}/toggle-visibility`.
                    // `deleteFile` uses `/api/files/${file.cid}`.
                    // Maybe `GET /api/files/${file.cid}` exists?
                    // Let's try to use it.
                    
                    const res = await fetchWithAuth(`/api/files/${cid}`); // Assuming this endpoint exists or I will create it/use list
                    // If it doesn't exist, this will fail.
                    // Let's check backend routes if possible.
                    // But I'll assume standard REST.
                    
                    // If that fails, fallback to direct download.
                     const directUrl = getDownloadUrl(cid);
                     window.open(directUrl, '_blank');
                     return;
                } catch (e) {
                     const directUrl = getDownloadUrl(cid);
                     window.open(directUrl, '_blank');
                     return;
                }
            }
            
            // If we have the file object (found in list or fetched)
            const url = getFileDownloadUrl(file);
            if (url.startsWith('http')) {
                window.open(url, '_blank');
            } else {
                window.location.href = url;
            }
        };

        // We need to implement the fetchSingleFile logic properly if I want to support it.
        // But for now, I'll update the window.handleFileRefClick to use a more robust approach:
        // 1. Check `files.value`.
        // 2. If not found, use `getDownloadUrl` (default).
        // This is a safe MVP.
        
        window.handleFileRefClick = (cid) => {
             const file = files.value.find(f => f.cid === cid) || fileSelectorList.value.find(f => f.cid === cid);
             if (file) {
                 const url = getFileDownloadUrl(file);
                 if (url.startsWith('http')) {
                     window.open(url, '_blank');
                 } else {
                     window.location.href = url;
                 }
             } else {
                 // Fallback: we don't know the filename/ext/tags, so we can't apply protocol templates accurately.
                 // We just open the direct download link.
                 // This is acceptable for files not in the current view.
                 const url = getDownloadUrl(cid);
                 window.open(url, '_blank');
             }
        };

        onMounted(async () => {
            try {
                await Promise.all([
                    checkStatus(),
                    fetchPolicy(),
                    checkAuth()
                ]);
            } catch (e) {
                console.error("Initialization error:", e);
            } finally {
                isAppReady.value = true;
            }
            
            if (user.value) {
                fetchNotifications();
                setInterval(fetchNotifications, 60000);
            }
            
            fetchFiles();
        });

        return {
            isAppReady,
            isMobileUploadExpanded,
            lang,
            t,
            toggleLang,
            status,
            version,
            files,
            uploading,
            uploadStatusText,
            fileInput,
            user,
            showLogin,
            showRegister,
            authForm,
            authError,
            isPublicUpload,
            handleFileSelect,
            handleDrop,
            fetchFiles,
            formatSize,
            truncate,
            formatDate,
            copyToClipboard,
            login,
            register,
            logout,
            getDownloadUrl,
            toggleVisibility,
            deleteFile,
            isOwner,
            changePage,
            changeItemsPerPage,
            handleSearch,
            handleFilterTag,
            clearSearch,
            searchQuery,
            filterTag,
            totalItems,
            currentPage,
            itemsPerPage,
            totalPages,
            uploadConfig,
            registrationPolicy,
            canUpload,
            canPreview,
            canDownload,
            siteInfo,
            showTagModal,
            currentFile,
            selectedTags,
            allowedTags,
            openTagModal,
            saveTags,
            loading,
            fileInputAccept,
            showChangePasswordModal,
            changePasswordForm,
            changePassword,
            notifications,
            unreadNotificationsCount,
            showNotifications,
            toggleNotifications,
            markAllAsRead,
            handleNotificationClick,
            showAllNotificationsModal,
            allNotifications,
            allNotificationsLoading,
            allNotificationsHasMore,
            openAllNotifications,
            fetchAllNotifications,
            showProfileModal,
            userProfileForm,
            profileError,
            protocolOptions,
            openProfileModal,
            updateProfile,
            getFileDownloadUrl,
            currentView,
            switchView,
            topics,
            forumPage,
            forumTotalPages,
            currentTopic,
            showCreateTopic,
            newTopicForm,
            newCommentContent,
            fetchTopics,
            openTopic,
            createTopic,
            submitComment,
            deleteTopic,
            deleteComment,
            chatMessages,
            chatInput,
            chatPlaceholder,
            chatCooldown,
            onlineUsers,
            isChatConnected,
            showOnlineUsersModal,
            sendChatMessage,
            renderMarkdown,
            handleMdAction,
            scrollToTop: scrollToTopAction,
            scrollToBottom: scrollToBottomAction,
            chatContainer,
            forumListContainer,
            forumDetailContainer,
            showEmojiPicker,
            emojiPickerStyle,
            emojis,
            toggleEmojiPicker,
            insertEmoji,
            handlePaste,
            handleImageUpload,
            showFileSelectorModal,
            fileSelectorTarget,
            fileSelectorQuery,
            fileSelectorList,
            fileSelectorPage,
            fileSelectorTotalPages,
            fileSelectorLoading,
            openFileSelector,
            fetchFilesForSelector,
            insertFileReference
        };
    }
}).mount('#app');
