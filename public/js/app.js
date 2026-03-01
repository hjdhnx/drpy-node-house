import { createApp, ref, onMounted, computed, reactive, watch } from 'vue';
import { zh, en } from './i18n.js';

createApp({
    setup() {
        // I18n
        const lang = ref(localStorage.getItem('lang') || 'zh');
        const t = computed(() => lang.value === 'zh' ? zh : en);
        
        const toggleLang = () => {
            lang.value = lang.value === 'zh' ? 'en' : 'zh';
            localStorage.setItem('lang', lang.value);
        };

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

        // Computed permissions
        const canUpload = computed(() => {
            return user.value || uploadConfig.value.anonymous_upload === 'true';
        });

        const canPreview = computed(() => {
            return user.value || uploadConfig.value.anonymous_preview === 'true';
        });

        const canDownload = computed(() => {
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

        const uploadSingleFile = async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            
            const headers = {};
            if (token.value) {
                headers['Authorization'] = `Bearer ${token.value}`;
            }

            const query = `?is_public=${isPublicUpload.value}`;
            const res = await fetch(`/api/files/upload${query}`, {
                method: 'POST',
                headers,
                body: formData
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Upload failed');
            }
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

        const copyToClipboard = (text) => {
            navigator.clipboard.writeText(text);
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

        onMounted(() => {
            checkStatus();
            checkAuth();
            fetchFiles();
            fetchPolicy();
        });

        return {
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
            changePassword
        };
    }
}).mount('#app');
