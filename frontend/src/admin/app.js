import { ref, onMounted, watch, computed } from 'vue';
import { zh, en } from '../shared/i18n.js';
import { request } from '../api/request.js';
import { useAppStore } from '../stores/app.js';
import { useAuthStore } from '../stores/auth.js';
import { message, Modal } from 'ant-design-vue';

const fetch = request;

const defaultSettings = () => ({
    registration_policy: 'approval',
    allowed_extensions: '.json,.txt,.py,.php,.js,.m3u',
    max_file_size: 204800,
    image_compression_enabled: 'true',
    allowed_tags: 'ds,dr2,catvod,php,hipy,json,jx,优,失效,密',
    anonymous_upload: 'false',
    anonymous_preview: 'false',
    anonymous_download: 'false',
    site_name: '',
    site_welcome: '',
    site_copyright: '',
    site_icp: '',
    notification_limit: 10,
    leaderboard_limit: 10,
    notification_templates: JSON.stringify({
        register_approval: {
            en: { title: 'New Registration Request', message: 'User {{username}} has registered and requires approval.' },
            zh: { title: '新用户注册申请', message: '用户 {{username}} 已注册，需要您的审核。' }
        },
        account_approved: {
            en: { title: 'Account Approved', message: 'Your account has been approved. You can now access all features.' },
            zh: { title: '账号审核通过', message: '您的账号已通过审核，现在可以使用所有功能。' }
        },
        account_banned: {
            en: { title: 'Account Banned', message: 'Your account has been banned due to policy violations.' },
            zh: { title: '账号已被封禁', message: '由于违反相关规定，您的账号已被封禁。' }
        },
        account_unbanned: {
            en: { title: 'Account Unbanned', message: 'Your account has been unbanned.' },
            zh: { title: '账号解封', message: '您的账号已解除封禁。' }
        }
    }, null, 2)
});

const normalizePrettyJson = (value) => {
    if (!value || typeof value !== 'string') return value;
    try {
        return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
        return value;
    }
};

export function useAdminApp() {
    const asyncConfirm = (msg) => {
        return new Promise((resolve) => {
            Modal.confirm({
                title: t.value.confirmTitle || '提示 / Confirm',
                content: msg,
                okText: t.value.confirm || 'OK',
                cancelText: t.value.cancel || 'Cancel',
                onOk() { resolve(true); },
                onCancel() { resolve(false); }
            });
        });
    };

    const appStore = useAppStore();
    const authStore = useAuthStore();
    const lang = computed({
        get: () => appStore.lang,
        set: (value) => appStore.setLang(value)
    });
    const t = computed(() => lang.value === 'zh' ? zh : en);
    const token = computed({
        get: () => authStore.token,
        set: (value) => authStore.setToken(value)
    });

    const user = ref(null);
    const version = ref('');
    const currentView = ref('users');
    const users = ref([]);
    const totalUsers = ref(0);
    const currentUserPage = ref(1);
    const usersPerPage = ref(10);
    const totalUserPages = ref(1);
    const userSearchQuery = ref('');
    const userStatusFilter = ref('');
    const settings = ref(defaultSettings());
    const invites = ref([]);
    const notification = ref('');
    const isSidebarOpen = ref(false);
    const loading = ref(false);
    const showCreateInviteModal = ref(false);
    const showUserDetailsModal = ref(false);
    const selectedUser = ref(null);
    const inviteForm = ref({ max_uses: 1 });

    const protocolOptions = computed(() => {
        if (!settings.value?.download_protocols) return [];
        try {
            const protocols = typeof settings.value.download_protocols === 'string'
                ? JSON.parse(settings.value.download_protocols)
                : settings.value.download_protocols;
            return Object.keys(protocols);
        } catch {
            return [];
        }
    });

    const setUserSearchQuery = (value) => {
        userSearchQuery.value = value;
    };

    const setUserStatusFilter = (value) => {
        userStatusFilter.value = value;
    };

    const setUsersPerPage = (value) => {
        usersPerPage.value = Number(value);
    };

    const handleNavigate = (view) => {
        currentView.value = view;
        isSidebarOpen.value = false;
    };

    const closeUserDetailsModal = () => {
        showUserDetailsModal.value = false;
    };

    const openInviteModal = () => {
        inviteForm.value = { max_uses: 1 };
        showCreateInviteModal.value = true;
    };

    const closeInviteModal = () => {
        showCreateInviteModal.value = false;
    };

    const formatSize = (bytes) => {
        if (!Number(bytes)) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        const date = new Date(timestamp > 10000000000 ? timestamp : timestamp * 1000);
        return date.toLocaleString(lang.value === 'zh' ? 'zh-CN' : 'en-US');
    };

    const showNotification = (msg, type = 'success') => {
        if (type === 'error') message.error(msg);
        else if (type === 'warning') message.warning(msg);
        else if (type === 'success') message.success(msg);
        else message.info(msg);
    };

    const fetchWithAuth = async (url, options = {}) => {
        if (!token.value) {
            window.location.href = '/';
            return null;
        }

        const headers = {
            ...options.headers,
            Authorization: `Bearer ${token.value}`
        };

        if (options.body && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, { ...options, headers });
        if (response.status === 401 || response.status === 403) {
            throw new Error('Unauthorized');
        }
        return response;
    };

    const fetchSystemStatus = async () => {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            if (data.version) {
                version.value = data.version;
            }
        } catch (error) {
            console.error('Failed to fetch system status', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const query = new URLSearchParams({
                page: String(currentUserPage.value),
                limit: String(usersPerPage.value),
                search: userSearchQuery.value,
                status: userStatusFilter.value
            });
            const response = await fetchWithAuth(`/api/admin/users?${query.toString()}`);
            if (!response) return;
            const data = await response.json();

            if (data.users) {
                users.value = data.users;
                totalUsers.value = data.total;
                totalUserPages.value = data.totalPages;
                currentUserPage.value = data.page;
                return;
            }

            users.value = data;
            totalUsers.value = Array.isArray(data) ? data.length : 0;
            totalUserPages.value = 1;
        } catch (error) {
            console.error(error);
        }
    };

    const fetchSettings = async () => {
        try {
            const response = await fetchWithAuth('/api/admin/settings');
            if (!response) return;
            const data = await response.json();
            if (data.max_file_size) data.max_file_size = parseInt(data.max_file_size, 10);
            if (data.chat_interval) data.chat_interval = parseInt(data.chat_interval, 10);
            if (data.leaderboard_limit) data.leaderboard_limit = parseInt(data.leaderboard_limit, 10);
            data.notification_templates = normalizePrettyJson(data.notification_templates);
            data.download_protocols = normalizePrettyJson(data.download_protocols);
            settings.value = { ...settings.value, ...data };
        } catch (error) {
            console.error('Failed to fetch settings', error);
        }
    };

    const fetchInvites = async () => {
        try {
            const response = await fetchWithAuth('/api/admin/invites');
            if (!response) return;
            invites.value = await response.json();
        } catch (error) {
            console.error(error);
        }
    };

    const changeUserPage = (page) => {
        if (page < 1 || page > totalUserPages.value) return;
        currentUserPage.value = page;
        fetchUsers();
    };

    const changeUsersPerPage = () => {
        currentUserPage.value = 1;
        fetchUsers();
    };

    const handleUserSearch = () => {
        currentUserPage.value = 1;
        fetchUsers();
    };

    const handleUserStatusFilter = () => {
        currentUserPage.value = 1;
        fetchUsers();
    };

    const clearUserSearch = () => {
        userSearchQuery.value = '';
        handleUserSearch();
    };

    const updateUserStatus = async (id, status) => {
        if (!(await asyncConfirm(`确定要更改用户状态为 ${status} 吗？`))) return;
        try {
            const response = await fetchWithAuth(`/api/admin/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status })
            });
            if (!response) return;
            if (response.ok) {
                showNotification('用户状态已更新');
                fetchUsers();
                return;
            }
            showNotification('更新失败');
        } catch {
            showNotification('更新失败');
        }
    };

    const viewUserDetails = (targetUser) => {
        selectedUser.value = { ...targetUser };
        if (!selectedUser.value.download_preference) {
            selectedUser.value.download_preference = 'default';
        }
        selectedUser.value.points = Number.isFinite(Number(selectedUser.value.points))
            ? parseInt(selectedUser.value.points, 10)
            : 0;
        showUserDetailsModal.value = true;
    };

    const saveUserDetails = async () => {
        if (!selectedUser.value) return;
        try {
            const payload = {};
            if (selectedUser.value.nickname !== undefined) payload.nickname = selectedUser.value.nickname;
            if (selectedUser.value.qq !== undefined) payload.qq = selectedUser.value.qq;
            if (selectedUser.value.email !== undefined) payload.email = selectedUser.value.email;
            if (selectedUser.value.phone !== undefined) payload.phone = selectedUser.value.phone;
            if (selectedUser.value.download_preference !== undefined) payload.download_preference = selectedUser.value.download_preference;
            if (selectedUser.value.points !== undefined) payload.points = parseInt(selectedUser.value.points, 10);

            const response = await fetchWithAuth(`/api/admin/users/${selectedUser.value.id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            if (!response) return;

            if (response.ok) {
                showNotification('用户信息已更新');
                showUserDetailsModal.value = false;
                fetchUsers();
                return;
            }

            const data = await response.json();
            showNotification(data.error || '更新失败');
        } catch {
            showNotification('更新失败');
        }
    };

    const updateUserRole = async (id, role) => {
        const confirmText = role === 'admin' ? '确定要将用户设为管理员吗？' : '确定要取消该用户的管理员权限吗？';
        if (!(await asyncConfirm(confirmText))) return;
        try {
            const response = await fetchWithAuth(`/api/admin/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ role })
            });
            if (!response) return;
            if (response.ok) {
                showNotification(role === 'admin' ? '已设为管理员' : '已取消管理员权限');
                fetchUsers();
                return;
            }
            showNotification('更新失败');
        } catch {
            showNotification('更新失败');
        }
    };

    const deleteUser = async (id) => {
        if (!(await asyncConfirm('确定要删除该用户吗？该操作不可撤销，且会删除该用户的所有文件！'))) return;
        try {
            const response = await fetchWithAuth(`/api/admin/users/${id}`, {
                method: 'DELETE'
            });
            if (!response) return;
            if (response.ok) {
                showNotification('用户已删除');
                fetchUsers();
                return;
            }
            const data = await response.json();
            showNotification(data.error || '删除失败');
        } catch {
            showNotification('删除失败');
        }
    };

    const resetUserPassword = async (id, username) => {
        const newPassword = window.prompt(`请输入用户 ${username} 的新密码:`);
        if (newPassword === null) return;
        if (!newPassword.trim()) {
            showNotification('密码不能为空');
            return;
        }

        try {
            const response = await fetchWithAuth(`/api/admin/users/${id}/reset-password`, {
                method: 'POST',
                body: JSON.stringify({ password: newPassword })
            });
            if (!response) return;
            if (response.ok) {
                showNotification('密码重置成功');
                return;
            }
            const data = await response.json();
            showNotification(data.error || '重置失败');
        } catch (error) {
            showNotification(`重置失败: ${error.message}`);
        }
    };

    const saveSettings = async () => {
        loading.value = true;
        try {
            const payload = { ...settings.value };
            payload.max_file_size = parseInt(payload.max_file_size, 10);
            const response = await fetchWithAuth('/api/admin/settings', {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            if (!response) return;
            showNotification(response.ok ? '设置已保存' : '保存失败');
        } catch (error) {
            showNotification(`保存失败: ${error.message}`);
        } finally {
            loading.value = false;
        }
    };

    const resetSettings = async () => {
        if (!(await asyncConfirm(t.value.resetConfirm1))) return;
        if (!(await asyncConfirm(t.value.resetConfirm2))) return;

        loading.value = true;
        try {
            const response = await fetchWithAuth('/api/admin/settings/reset', {
                method: 'POST',
                body: JSON.stringify({})
            });
            if (!response) return;

            if (response.ok) {
                const data = await response.json();
                if (data.settings) {
                    const nextSettings = { ...data.settings };
                    if (nextSettings.max_file_size) nextSettings.max_file_size = parseInt(nextSettings.max_file_size, 10);
                    nextSettings.notification_templates = normalizePrettyJson(nextSettings.notification_templates);
                    nextSettings.download_protocols = normalizePrettyJson(nextSettings.download_protocols);
                    settings.value = { ...settings.value, ...nextSettings };
                } else {
                    fetchSettings();
                }
                showNotification(t.value.resetSuccess);
                return;
            }

            showNotification(t.value.resetFailed);
        } catch (error) {
            showNotification(`${t.value.resetFailed}: ${error.message}`);
        } finally {
            loading.value = false;
        }
    };

    const createInvite = async () => {
        loading.value = true;
        try {
            const response = await fetchWithAuth('/api/admin/invites', {
                method: 'POST',
                body: JSON.stringify({ max_uses: parseInt(inviteForm.value.max_uses, 10) || 1 })
            });
            if (!response) return;
            if (response.ok) {
                showNotification('邀请码已生成');
                showCreateInviteModal.value = false;
                fetchInvites();
                return;
            }
            showNotification('生成失败');
        } catch (error) {
            showNotification(`生成失败: ${error.message}`);
        } finally {
            loading.value = false;
        }
    };

    const deleteInvite = async (code) => {
        if (!(await asyncConfirm('确定要删除这个邀请码吗？'))) return;
        try {
            const response = await fetchWithAuth(`/api/admin/invites/${code}`, {
                method: 'DELETE'
            });
            if (!response) return;
            if (response.ok) {
                showNotification('邀请码已删除');
                fetchInvites();
                return;
            }
            showNotification('删除失败');
        } catch {
            showNotification('删除失败');
        }
    };

    const downloadPackage = async () => {
        try {
            const tokenValue = token.value;
            if (!tokenValue) {
                window.location.href = '/';
                return;
            }

            const response = await window.fetch('/api/admin/download-package', {
                headers: {
                    Authorization: `Bearer ${tokenValue}`
                }
            });
            
            if (!response.ok) {
                showNotification('下载失败');
                return;
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            const disposition = response.headers.get('content-disposition');
            let filename = 'package.zip';

            if (disposition && disposition.includes('attachment')) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
                if (matches?.[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
            showNotification('打包下载成功');
        } catch (error) {
            console.error(error);
            showNotification(`下载失败: ${error.message}`);
        }
    };

    const copyToClipboard = async (text) => {
        await navigator.clipboard.writeText(text);
        showNotification('已复制到剪贴板');
    };

    watch(lang, () => {
        document.title = `${t.value.adminPanel} - ${t.value.title}`;
    }, { immediate: true });

    watch(currentView, (view) => {
        if (view === 'users') fetchUsers();
        if (view === 'settings') fetchSettings();
        if (view === 'invites') fetchInvites();
    });

    onMounted(async () => {
        if (!token.value) {
            window.location.href = '/';
            return;
        }

        try {
            const response = await fetchWithAuth('/api/auth/me');
            if (!response?.ok) {
                throw new Error('Failed to fetch user info');
            }

            const userData = await response.json();
            user.value = userData;

            if (user.value.role !== 'admin' && user.value.role !== 'super_admin') {
                window.location.href = '/';
                return;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = '/';
            return;
        }

        fetchUsers();
        fetchSettings();
        fetchSystemStatus();
    });

    return {
        isSidebarOpen,
        currentView,
        version,
        user,
        users,
        totalUsers,
        currentUserPage,
        usersPerPage,
        totalUserPages,
        userSearchQuery,
        userStatusFilter,
        settings,
        invites,
        loading,
        notification,
        showUserDetailsModal,
        selectedUser,
        showCreateInviteModal,
        inviteForm,
        protocolOptions,
        t,
        handleNavigate,
        formatDate,
        formatSize,
        changeUserPage,
        setUsersPerPage,
        setUserSearchQuery,
        setUserStatusFilter,
        changeUsersPerPage,
        handleUserSearch,
        handleUserStatusFilter,
        clearUserSearch,
        updateUserStatus,
        resetUserPassword,
        updateUserRole,
        deleteUser,
        viewUserDetails,
        saveUserDetails,
        closeUserDetailsModal,
        saveSettings,
        resetSettings,
        copyToClipboard,
        deleteInvite,
        openInviteModal,
        closeInviteModal,
        createInvite,
        downloadPackage
    };
}
