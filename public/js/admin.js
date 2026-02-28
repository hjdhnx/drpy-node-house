import { createApp, ref, onMounted } from 'vue';

createApp({
    setup() {
        const user = ref(null);
        const token = ref(localStorage.getItem('token') || null);
        const currentView = ref('users');
        const users = ref([]);
        const settings = ref({ 
            registration_policy: 'open',
            allowed_extensions: '.json,.txt,.py,.php,.js,.m3u',
            max_file_size: 102400
        });
        const invites = ref([]);
        const notification = ref({ show: false, message: '', type: 'success' });

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
                // Do not redirect immediately, let caller handle or just log
                // window.location.href = '/';
                throw new Error('Unauthorized');
            }
            return res;
        };

        const fetchUsers = async () => {
            try {
                const res = await fetchWithAuth('/api/admin/users');
                users.value = await res.json();
            } catch (e) {
                console.error(e);
            }
        };

        const fetchSettings = async () => {
            try {
                const res = await fetchWithAuth('/api/admin/settings');
                settings.value = await res.json();
            } catch (e) {
                console.error(e);
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

        const saveSettings = async () => {
            try {
                const res = await fetchWithAuth('/api/admin/settings', {
                    method: 'PUT',
                    body: JSON.stringify(settings.value)
                });
                if (res.ok) {
                    showNotification('设置已保存');
                } else {
                    showNotification('保存失败', 'error');
                }
            } catch (e) {
                showNotification('保存失败', 'error');
            }
        };

        const createInvite = async () => {
            const maxUses = prompt('请输入最大使用次数 (0为不限):', '1');
            if (maxUses === null) return;
            
            try {
                const res = await fetchWithAuth('/api/admin/invites', {
                    method: 'POST',
                    body: JSON.stringify({ max_uses: parseInt(maxUses) })
                });
                if (res.ok) {
                    showNotification('邀请码已生成');
                    fetchInvites();
                } else {
                    showNotification('生成失败', 'error');
                }
            } catch (e) {
                showNotification('生成失败', 'error');
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
            // Check if timestamp is seconds or milliseconds
            const date = new Date(timestamp > 10000000000 ? timestamp : timestamp * 1000);
            return date.toLocaleString('zh-CN');
        };

        onMounted(async () => {
            // Decode token to get user info
            if (token.value) {
                try {
                    const base64Url = token.value.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                    user.value = JSON.parse(jsonPayload);
                    
                    if (user.value.role !== 'admin') {
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

            await Promise.all([
                fetchUsers(),
                fetchSettings(),
                fetchInvites()
            ]);
        });

        return {
            user,
            currentView,
            users,
            settings,
            invites,
            notification,
            updateUserStatus,
            updateUserRole,
            saveSettings,
            createInvite,
            deleteInvite,
            formatDate,
            formatSize
        };
    }
});
