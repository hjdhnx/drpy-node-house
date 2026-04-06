import { defineStore } from 'pinia';

const getInitialLang = () => {
  try {
    return localStorage.getItem('lang') || 'zh';
  } catch {
    return 'zh';
  }
};

export const useAppStore = defineStore('app', {
  state: () => ({
    lang: getInitialLang()
  }),
  actions: {
    setLang(lang) {
      this.lang = lang;
      try {
        localStorage.setItem('lang', lang);
      } catch {}
    },
    toggleLang() {
      this.setLang(this.lang === 'zh' ? 'en' : 'zh');
    }
  }
});
