import { createApp } from 'vue';
import {NotesGraph} from './models/graph';
import NoteEditorVM from './note_editor';

import App from './App.vue';
import './index.css';

export const notes_graph = new NotesGraph;
export const note_editor = new NoteEditorVM;

createApp(App).mount('#app');
