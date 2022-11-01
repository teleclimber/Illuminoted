import {ref, nextTick} from 'vue';
import type {Ref} from 'vue';
import { notes_graph } from './main';

export default class PageControl {
	show_threads = ref(false);

	showThreads() {
		this.show_threads.value = true;
	}
	hideThreads() {
		this.show_threads.value = false;
	}

	#show_search = ref(false);
	showSearch() {
		this.#show_search.value = true;
	}
	hideSearch() {
		this.#show_search.value = false;
	}
	get show_search() {
		return this.#show_search.value;
	}

	context_id = ref(1);
	setContext(id:number) {
		this.context_id.value = id;
		notes_graph.setContext(id);
	}

	// we sould probably use native keyboard shortcuts to do note selection?
	// although that won't work with touch-only devices.
	selected_note_id :Ref<number|undefined> = ref();

	selectNote(note_id:number) {
		if( this.selected_note_id.value === note_id ) this.selected_note_id.value = undefined;
		else this.selected_note_id.value = note_id;
	}
	deselectNote() {
		this.selected_note_id.value = undefined;
	}

	// TODO add and edit note should go through Page Control as well.

	scrollToNote(note_id:number|undefined) {
		if( !note_id ) return;	// allows simpler code in templates
		// temporary hack.
		document.querySelector('#stack-note-'+note_id)?.scrollIntoView();
	}
}