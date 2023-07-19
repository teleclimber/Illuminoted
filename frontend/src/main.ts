import { createApp } from 'vue';
import { createPinia } from 'pinia'
import { useUIStateStore } from './models/ui_state';

const pinia = createPinia();

import App from './App.vue';
import './index.css';
import { useThreadsStore } from './models/threads';

const app = createApp(App);
app.use(pinia);
app.mount('body');

let context_thread = 1;
const p = window.location.pathname.substring(1);
if( p ) {
	context_thread = Number(p);
}
const uiStateStore = useUIStateStore();
uiStateStore.setContext(context_thread);

useThreadsStore().getLatestSubThreads(1, 10).then( (threads) => {
	uiStateStore.batchExpandThreads(threads);
});