import { createApp } from 'vue';
import {NotesGraph} from './models/graph';
import NoteEditorVM from './note_editor';
import PageControl from './page_control';

export const page_control = new PageControl;

import App from './App.vue';
import './index.css';

export const notes_graph = new NotesGraph;
export const note_editor = new NoteEditorVM;

let context_thread = 1;
const p = window.location.pathname.substring(1);
if( p ) {
	context_thread = Number(p);
}
page_control.setContext(context_thread);

createApp(App).mount('#app');
