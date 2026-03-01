import { createApp, ref, onMounted, watch, computed } from 'vue';
import { zh, en } from './i18n.js';

createApp({
    setup() {
        const lang = ref(localStorage.getItem('lang') || 'zh');
        const t = computed(() => lang.value === 'zh' ? zh : en);

        const toggleLang = () => {
            lang.value = lang.value === 'zh' ? 'en' : 'zh';
            localStorage.setItem('lang', lang.value);
        };

        watch(lang, () => {
             document.title = t.value.adminPanel + ' - ' + t.value.title;
        }, { immediate: true });

        const user = ref(null);
        const version = ref('');
        const token = ref(localStorage.getItem('token') || null);
        const currentView = ref('users');
        const users = ref([]);
        const totalUsers = ref(0);
        const currentUserPage = ref(1);
        const usersPerPage = ref(10);
        const totalUserPages = ref(1);
        const userSearchQuery = ref('');
        
        const settings = ref({ 
            registration_policy: 'open',
            allowed_extensions: '.json,.txt,.py,.php,.js,.m3u',
            max_file_size: 204800,
            allowed_tags: 'ds,dr2,cat,php,hipy',
            anonymous_upload: 'false',
            anonymous_preview: 'false',
            anonymous_download: 'false',
            site_copyright: '',
            site_icp: '',
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
        });
        const invites = ref([]);
        const notification = ref({ show: false, message: '', type: 'success' });
        const isSidebarOpen = ref(false);
        
        // UI State
        const loading = ref(false);
        const showInviteModal = ref(false);
        const inviteForm = ref({ max_uses: 1 });

        const formatSize = (bytes) => {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        const showNotification = (msg, type = 'success') => {
            notification.value = { show: true, message: msg, type };
            setTimeout(() => notification.value.show = false, 3000);
        };

        const fetchSystemStatus = async () => {
            try {
                const res = await fetch('/api/status');
                const data = await res.json();
                if (data.version) version.value = data.version;
            } catch (e) {
                console.error('Failed to fetch system status', e);
            }
        };

        const fetchWithAuth = async (url, options = {}) => {
            if (!token.value) {
                window.location.href = '/';
                return;
            }
            const headers = {
                ...options.headers,
                'Authorization': `Bearer ${token.value}`,
                'Content-Type': 'application/json'
            };
            const res = await fetch(url, { ...options, headers });
            if (res.status === 401 || res.status === 403) {
                throw new Error('Unauthorized');
            }
            return res;
        };

        const fetchUsers = async () => {
            try {
                const res = await fetchWithAuth(`/api/admin/users?page=${currentUserPage.value}&limit=${usersPerPage.value}&search=${encodeURIComponent(userSearchQuery.value)}`);
                const data = await res.json();
                
                if (data.users) {
                    users.value = data.users;
                    totalUsers.value = data.total;
                    totalUserPages.value = data.totalPages;
                    currentUserPage.value = data.page;
                } else {
                    // Backward compatibility
                    users.value = data;
                }
            } catch (e) {
                console.error(e);
            }
        };

        const changeUserPage = (page) => {
            if (page >= 1 && page <= totalUserPages.value) {
                currentUserPage.value = page;
                fetchUsers();
            }
        };

        const changeUsersPerPage = () => {
            currentUserPage.value = 1;
            fetchUsers();
        };

        const handleUserSearch = () => {
            currentUserPage.value = 1;
            fetchUsers();
        };

        const clearUserSearch = () => {
            userSearchQuery.value = '';
            handleUserSearch();
        };

        const fetchSettings = async () => {
            try {
                const res = await fetchWithAuth('/api/admin/settings');
                const data = await res.json();
                // Ensure max_file_size is number
                if (data.max_file_size) data.max_file_size = parseInt(data.max_file_size);
                settings.value = { ...settings.value, ...data };

                // Ensure notification_templates is formatted
                try {
                    if (settings.value.notification_templates && typeof settings.value.notification_templates === 'string') {
                        const parsed = JSON.parse(settings.value.notification_templates);
                        settings.value.notification_templates = JSON.stringify(parsed, null, 2);
                    }
                } catch (e) {
                    console.error('Failed to parse templates', e);
                }
            } catch (e) {
                console.error('Failed to fetch settings', e);
            }
        };

        const fetchInvites = async () => {
            try {
                const res = await fetchWithAuth('/api/admin/invites');
                invites.value = await res.json();
            } catch (e) {
                console.error(e);
            }
        };

        const updateUserStatus = async (id, status) => {
            if (!confirm(`确定要更改用户状态为 ${status} 吗？`)) return;
            try {
                const res = await fetchWithAuth(`/api/admin/users/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ status })
                });
                if (res.ok) {
                    showNotification('用户状态已更新');
                    fetchUsers();
                } else {
                    showNotification('更新失败', 'error');
                }
            } catch (e) {
                showNotification('更新失败', 'error');
            }
        };

        const updateUserRole = async (id, role) => {
            if (!confirm(`确定要将用户设为管理员吗？`)) return;
            try {
                const res = await fetchWithAuth(`/api/admin/users/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ role })
                });
                if (res.ok) {
                    showNotification('用户角色已更新');
                    fetchUsers();
                } else {
                    showNotification('更新失败', 'error');
                }
            } catch (e) {
                showNotification('更新失败', 'error');
            }
        };

        const deleteUser = async (id) => {
            if (!confirm('确定要删除该用户吗？该操作不可撤销，且会删除该用户的所有文件！')) return;
            try {
                const res = await fetchWithAuth(`/api/admin/users/${id}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    showNotification('用户已删除');
                    fetchUsers();
                } else {
                    const data = await res.json();
                    showNotification(data.error || '删除失败', 'error');
                }
            } catch (e) {
                showNotification('删除失败', 'error');
            }
        };

        const resetUserPassword = async (id, username) => {
            const newPassword = prompt(`请输入用户 ${username} 的新密码:`);
            if (newPassword === null) return; // Cancelled
            if (!newPassword.trim()) {
                showNotification('密码不能为空', 'error');
                return;
            }
            
            try {
                const res = await fetchWithAuth(`/api/admin/users/${id}/reset-password`, {
                    method: 'POST',
                    body: JSON.stringify({ password: newPassword })
                });
                
                if (res.ok) {
                    showNotification('密码重置成功');
                } else {
                    const data = await res.json();
                    showNotification(data.error || '重置失败', 'error');
                }
            } catch (e) {
                showNotification('重置失败: ' + e.message, 'error');
            }
        };

        const saveSettings = async () => {
            loading.value = true;
            try {
                // Ensure correct types
                const payload = { ...settings.value };
                payload.max_file_size = parseInt(payload.max_file_size);

                const res = await fetchWithAuth('/api/admin/settings', {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    showNotification('设置已保存');
                } else {
                    showNotification('保存失败', 'error');
                }
            } catch (e) {
                showNotification('保存失败: ' + e.message, 'error');
            } finally {
                loading.value = false;
            }
        };

        const resetSettings = async () => {
            if (!confirm(t.value.resetConfirm1)) return;
            if (!confirm(t.value.resetConfirm2)) return;

            loading.value = true;
            try {
                const res = await fetchWithAuth('/api/admin/settings/reset', {
                    method: 'POST',
                    body: JSON.stringify({}) // Send empty body to satisfy content-type: application/json check
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.settings) {
                        const newSettings = data.settings;
                        if (newSettings.max_file_size) newSettings.max_file_size = parseInt(newSettings.max_file_size);
                        
                        // Ensure notification_templates is formatted string
                        if (newSettings.notification_templates && typeof newSettings.notification_templates !== 'string') {
                             newSettings.notification_templates = JSON.stringify(newSettings.notification_templates, null, 2);
                        } else if (typeof newSettings.notification_templates === 'string') {
                            try {
                                const parsed = JSON.parse(newSettings.notification_templates);
                                newSettings.notification_templates = JSON.stringify(parsed, null, 2);
                            } catch (e) {
                                // ignore
                            }
                        }

                        settings.value = { ...settings.value, ...newSettings };
                    } else {
                        fetchSettings();
                    }
                    showNotification(t.value.resetSuccess);
                } else {
                    showNotification(t.value.resetFailed, 'error');
                }
            } catch (e) {
                showNotification(t.value.resetFailed + ': ' + e.message, 'error');
            } finally {
                loading.value = false;
            }
        };

        const createInvite = async () => {
            loading.value = true;
            try {
                const res = await fetchWithAuth('/api/admin/invites', {
                    method: 'POST',
                    body: JSON.stringify({ max_uses: parseInt(inviteForm.value.max_uses) || 1 })
                });
                if (res.ok) {
                    showNotification('邀请码已生成');
                    showInviteModal.value = false;
                    fetchInvites();
                } else {
                    showNotification('生成失败', 'error');
                }
            } catch (e) {
                showNotification('生成失败: ' + e.message, 'error');
            } finally {
                loading.value = false;
            }
        };

        const deleteInvite = async (code) => {
            if (!confirm('确定要删除这个邀请码吗？')) return;
            try {
                const res = await fetchWithAuth(`/api/admin/invites/${code}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    showNotification('邀请码已删除');
                    fetchInvites();
                } else {
                    showNotification('删除失败', 'error');
                }
            } catch (e) {
                showNotification('删除失败', 'error');
            }
        };

        const formatDate = (timestamp) => {
            if (!timestamp) return '-';
            const date = new Date(timestamp > 10000000000 ? timestamp : timestamp * 1000);
            return date.toLocaleString('zh-CN');
        };
        
        const copyToClipboard = (text) => {
            navigator.clipboard.writeText(text);
            showNotification('已复制到剪贴板');
        };

        // Watchers for view changes
        watch(currentView, (newView) => {
            if (newView === 'users') fetchUsers();
            if (newView === 'settings') fetchSettings();
            if (newView === 'invites') fetchInvites();
        });

        onMounted(async () => {
            if (token.value) {
                try {
                    const base64Url = token.value.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                    user.value = JSON.parse(jsonPayload);
                    
                    if (user.value.role !== 'admin' && user.value.role !== 'super_admin') {
                        window.location.href = '/';
                        return;
                    }
                } catch (e) {
                    window.location.href = '/';
                    return;
                }
            } else {
                window.location.href = '/';
                return;
            }

            // Initial fetch based on current view
            fetchUsers();
            fetchSystemStatus();
        });

        return {
            user,
            version,
            currentView,
            users,
            settings,
            invites,
            notification,
            loading,
            showInviteModal,
            inviteForm,
            updateUserStatus,
            updateUserRole,
            deleteUser,
            resetUserPassword,
            saveSettings,
            resetSettings,
            createInvite,
            deleteInvite,
            formatDate,
            formatSize,
            copyToClipboard,
            currentUserPage,
            usersPerPage,
            totalUserPages,
            changeUserPage,
            changeUsersPerPage,
            userSearchQuery,
            handleUserSearch,
            clearUserSearch,
            isSidebarOpen,
            t,
            lang,
            toggleLang
        };
    }
}).mount('#app');
