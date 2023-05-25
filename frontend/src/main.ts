import { createApp } from 'vue';
import { createPinia } from 'pinia'
import { usePageControlStore } from './page_control';

const pinia = createPinia();

import App from './App.vue';
import './index.css';

const app = createApp(App);
app.use(pinia);
app.mount('#app');

let context_thread = 1;
const p = window.location.pathname.substring(1);
if( p ) {
	context_thread = Number(p);
}
const pageStore = usePageControlStore();
pageStore.setContext(context_thread);
