import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import '@/styles/tailwind.css';
import '@/styles/legacy.css';
import MainAppShell from '@/main/components/MainAppShell.vue';

const container = document.getElementById('app');

if (container && !container.__vue_app__) {
  const app = createApp(MainAppShell);
  const pinia = createPinia();

  app.use(pinia);
  app.use(Antd);
  app.mount('#app');
}
