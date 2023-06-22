import {computed, ref, shallowRef, reactive} from 'vue';
import type {Ref, ComputedRef} from 'vue';
import { defineStore } from 'pinia';
import { useNotesGraphStore } from './graph';

export const useUIStateStore = defineStore('ui-state', () => {
	const notesStore = useNotesGraphStore();

	const show_threads = ref(false);

	function showThreads() {
		show_threads.value = true;
	}
	function hideThreads() {
		show_threads.value = false;
	}

	const _show_search = ref(false);
	function showSearch() {
		_show_search.value = true;
	}
	function hideSearch() {
		_show_search.value = false;
	}
	const show_search = computed( () => {
		return _show_search.value;
	});

	const _context_id = ref(1);
	function setContext(id:number) {
		_context_id.value = id;
		selected_threads.add(id);
		notesStore.setContext(id);
	}
	const context_id = computed( () => {
		return _context_id.value;
	});

	// we sould probably use native keyboard shortcuts to do note selection?
	// although that won't work with touch-only devices.
	const selected_note_id :Ref<number|undefined> = ref();

	function selectNote(note_id:number) {
		if( selected_note_id.value === note_id ) selected_note_id.value = undefined;
		else selected_note_id.value = note_id;
	}
	function deselectNote() {
		selected_note_id.value = undefined;
	}

	// TODO add and edit note should go through UI State as well.

	function scrollToNote(note_id:number|undefined) {
		if( !note_id ) return;	// allows simpler code in templates
		// temporary hack.
		document.querySelector('#stack-note-'+note_id)?.scrollIntoView();
	}


	const selected_threads :Set<number> = reactive(new Set);	// set of thread_ids for which we want to show notes
	const expanded_threads :Set<number> = reactive(new Set);	// set of thread_ids for which we show the children

	function selectThread(id:number) {
		selected_threads.add(id);
		notesStore.reloadNotes();
	}
	function deselectThread(id:number) {
		selected_threads.delete(id);
		notesStore.reloadNotes();
	}

	function toggleExpandedThread(id:number) {
		if( expanded_threads.has(id) ) expanded_threads.delete(id);
		else expanded_threads.add(id);
	}
	function batchExpandThreads(ids:number[]) {
		ids.forEach( id => expanded_threads.add(id) );
	}

	// threads panel:
	const _threads_width = ref(300);
	const threads_width = computed( () => {
		return _threads_width.value;
	});

	return {
		selected_threads, expanded_threads,
		selectThread, deselectThread, toggleExpandedThread, batchExpandThreads,
		setContext, context_id,
		show_threads, showThreads, hideThreads,
		show_search, showSearch, hideSearch,
		selected_note_id, selectNote, deselectNote,
		scrollToNote,
		threads_width,
	}

});