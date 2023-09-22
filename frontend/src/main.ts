import { createApp } from 'vue';
import { createPinia } from 'pinia'
import { useUIStateStore } from './stores/ui_state';

const pinia = createPinia();

import App from './App.vue';
import './index.css';

const app = createApp(App);
app.use(pinia);
app.mount('body');

useUIStateStore().initDataFromURL();