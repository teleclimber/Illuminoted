import {ref, computed} from 'vue';
import type {Ref} from 'vue';
import { defineStore } from 'pinia';
import { useNotesGraphStore } from './models/graph';

export const usePageControlStore = defineStore('page-control', () => {
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
		const notesStore = useNotesGraphStore();
		notesStore.setContext(id);
	}

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

	// TODO add and edit note should go through Page Control as well.

	function scrollToNote(note_id:number|undefined) {
		if( !note_id ) return;	// allows simpler code in templates
		// temporary hack.
		document.querySelector('#stack-note-'+note_id)?.scrollIntoView();
	}

	return {
		setContext,
		show_threads, showThreads, hideThreads,
		show_search, showSearch, hideSearch,
		selected_note_id, selectNote, deselectNote,
		scrollToNote
	}
});