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

	context_id = ref(1);
	setContext(id:number) {
		this.context_id.value = id;
		this.filter(id);
		notes_graph.setContext(id);
	}
	filter_thread = ref(1);
	filter(thread_id:number) {
		this.filter_thread.value = thread_id;
		notes_graph.setFilterThread(thread_id);
	}

	// we sould probably use native keyboard shortcuts to do note selection?
	// although that won't work with touch-only devices.
	#selected_note_id :Ref<number|undefined> = ref();

	selectNote(note_id:number) {
		this.#selected_note_id.value = note_id;
	}
	deselectNote() {
		this.#selected_note_id.value = undefined;
	}

}