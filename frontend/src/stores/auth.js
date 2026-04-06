import { defineStore } from 'pinia';

const getInitialUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const syncToken = (token) => {
  try {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  } catch {}
};

const syncUser = (user) => {
  try {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  } catch {}
};

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: (() => {
      try {
        return localStorage.getItem('token') || null;
      } catch {
        return null;
      }
    })(),
    user: getInitialUser()
  }),
  actions: {
    setToken(token) {
      this.token = token;
      syncToken(token);
    },
    setUser(user) {
      this.user = user;
      syncUser(user);
    },
    setAuth({ token = null, user = null } = {}) {
      this.setToken(token);
      this.setUser(user);
    },
    clearAuth() {
      this.setAuth({ token: null, user: null });
    }
  }
});
