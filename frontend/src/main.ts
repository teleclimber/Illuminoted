import { createApp } from 'vue';
import {NotesGraph} from './models/graph';

import App from './App.vue';
import './index.css';

export const notes_graph = new NotesGraph;

createApp(App).mount('#app');
