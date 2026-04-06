import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import '@/styles/tailwind.css';
import '@/styles/legacy.css';
import AdminApp from '@/admin/AdminApp.vue';

const pinia = createPinia();
const app = createApp(AdminApp);

app.use(pinia);
app.use(Antd);

const container = document.getElementById('app');
if (container && !container.__vue_app__) {
  app.mount('#app');
}
