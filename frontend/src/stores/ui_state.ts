import {computed, ref, watch, reactive} from 'vue';
import type {Ref} from 'vue';
import { defineStore } from 'pinia';
import { useNotesGraphStore } from './graph';
import { useNoteStackStore } from './note_stack';
import { useThreadsStore } from './threads';

type State = {
	selected_threads: Set<number>,
	search: string
}

export const useUIStateStore = defineStore('ui-state', () => {
	const threadsStore = useThreadsStore();
	const noteStackStore = useNoteStackStore();
	const notesStore = useNotesGraphStore();

	const win_width = ref(window.innerWidth);
	const win_height = ref(window.innerHeight);	// maybe we don't need win_height
	window.addEventListener("load", (event) => {
		win_width.value = window.innerWidth;
		win_height.value = window.visualViewport?.height || window.innerHeight;
	});
	window.addEventListener("resize", (event) => {
		win_width.value = window.innerWidth;
		win_height.value = window.visualViewport?.height || window.innerHeight;
	});

	
	const show_threads = ref(window.innerWidth > 800);
	function showThreads() {
		show_threads.value = true;
	}
	function hideThreads() {
		show_threads.value = false;
	}

	const threads_pinnable = computed( () => {
		return win_width.value > 600;
	});
	const pin_threads = ref(window.innerWidth > 800);
	function pinThreads() {
		if( threads_pinnable.value ) pin_threads.value = true;
	}
	function unPinThreads() {
		pin_threads.value = false;
	}

	const _threads_width = ref(300);
	const threads_width = computed( () => {
		if( threads_pinnable.value ) return _threads_width.value;
		else return win_width.value;
	});

	const _show_search = ref(false);
	function showSearch() {
		_show_search.value = true;
	}
	function hideSearch() {
		_show_search.value = false;
		cur_search.value = '';
		debounced_search.value = '';
		noteStackStore.setTargetDateToVisible();
		noteStackStore.reloadNotes();
	}
	const show_search = computed( () => {
		return _show_search.value;
	});

	const cur_search = ref('');
	const debounced_search = ref('');
	let debounceTimer :number|undefined;
	watch( cur_search, () => {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			if( cur_search.value === debounced_search.value ) return;
			console.log( "in debounced search", cur_search.value, debounced_search.value )
			noteStackStore.setTargetDateToVisible();
			debounced_search.value = cur_search.value;
			noteStackStore.reloadNotes();
		}, 150);
	});
	watch( debounced_search, () => {
		// if search is reset but there is search in the URL, then push history to remove search from URL.
		const state = readUrlParams();
		if( state.search && debounced_search.value === '' ) updateUrlParams();
	});
	
	const _context_id = ref(1);
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

	function scrollToNote(note_id:number|undefined) {
		if( !note_id ) return;	// allows simpler code in templates
		// temporary hack.
		document.querySelector('#stack-note-'+note_id)?.scrollIntoView();
	}

	const selected_threads :Set<number> = reactive(new Set);	// set of thread_ids for which we want to show notes
	const expanded_threads :Set<number> = reactive(new Set);	// set of thread_ids for which we show the children

	function threadClicked(id: number) {
		if( selected_threads.has(id) ) deselectThread(id);
		else selectThread(id);
	}
	function selectThread(id:number) {
		noteStackStore.setTargetDateToVisible();
		selected_threads.add(id);
		updateUrlParams();
		noteStackStore.reloadNotes();
	}
	function deselectThread(id:number) {
		noteStackStore.setTargetDateToVisible();
		selected_threads.delete(id);
		updateUrlParams();
		noteStackStore.reloadNotes();
	}

	function toggleExpandedThread(id:number) {
		if( expanded_threads.has(id) ) expanded_threads.delete(id);
		else expanded_threads.add(id);
	}
	function batchExpandThreads(ids:number[]) {
		ids.forEach( id => expanded_threads.add(id) );
	}

	const show_edit_thread :Ref<number|undefined> = ref();
	function showEditThread(id:number) {
		// check if note editor is not open first? (i should not be based on how UI works)
		if( show_edit_thread.value ) return;
		deselectNote()
		show_edit_thread.value = id;
	}
	function closeEditThread() {
		show_edit_thread.value = undefined;
	}

	// URL handling
	function updateUrlParams() {
		const params = new URLSearchParams(document.location.search);
		params.set("threads", Array.from(selected_threads).join(','));
		if( debounced_search.value ) params.set("search", debounced_search.value);
		else params.delete("search");
		
		history.pushState(null, '', '?'+params.toString());
	}
	function readUrlParams() :State {
		const ret :State = {
			selected_threads: new Set,
			search: ""
		};
		const params = new URLSearchParams(document.location.search);
		const threads_str = params.get("threads");
		if( threads_str ) threads_str.split(",").forEach( t => ret.selected_threads.add(Number(t)));
		ret.search = params.get("search") || "";
		
		return ret;
	}
	addEventListener("popstate", (event) => {
		console.log("pop state", event);
		selected_threads.clear();
		const state = readUrlParams();
		cur_search.value = state.search;
		debounced_search.value = state.search;
		const expand :Set<number> = new Set;
		state.selected_threads.forEach( t => {
			selected_threads.add(t);
			let thread = threadsStore.getThread(t);
			while(thread && thread.parent) {
				expand.add(thread.id);
				thread = threadsStore.getThread(thread.parent);
			}
		});
		batchExpandThreads(Array.from(expand));
		noteStackStore.setTargetDateToVisible();
		noteStackStore.reloadNotes();
	});

	function initDataFromURL() {
		// if there are threads in URL, then load those.
		// if not select 1 and get latest threads.
		const state = readUrlParams();
		cur_search.value = state.search;
		debounced_search.value = state.search;
		if( state.selected_threads.size ) {
			state.selected_threads.forEach( t => selected_threads.add(t) );
			threadsStore.loadThreads(1, selected_threads).then( (threads) => {
				batchExpandThreads(threads);
			});
			noteStackStore.reloadNotes();
		}
		else {
			selected_threads.add(_context_id.value);	//basically thread 1
			threadsStore.getLatestSubThreads(1, 10).then( (threads) => {
				batchExpandThreads(threads);
				// actually I would like to load notes for the threads that were returned?
				noteStackStore.reloadNotes();
			});
		} 
	}

	function drillDownNote(note_id:number) {
		if( debounced_search.value !== "" ) {
			updateUrlParams();	//URL with search term so that going back will take us to the search term
			noteStackStore.setTargetNote(note_id);
			cur_search.value = "";
			debounced_search.value = "";
			// URL without search term is automatically added in a debounced_search watcher.
			noteStackStore.reloadNotes();
		}
		else if( selected_threads.size !== 1) {
			noteStackStore.setTargetNote(note_id);
			const note = notesStore.mustGetNote(note_id);
			selected_threads.clear();
			selected_threads.add(note.value.thread);
			updateUrlParams();
			noteStackStore.reloadNotes();
		}
	}

	return {
		selected_threads, expanded_threads,
		threadClicked, selectThread, deselectThread, toggleExpandedThread, batchExpandThreads,
		initDataFromURL, context_id,
		show_threads, showThreads, hideThreads,
		threads_pinnable, pin_threads, pinThreads, unPinThreads, threads_width,
		show_search, showSearch, hideSearch, cur_search, debounced_search,
		selected_note_id, selectNote, deselectNote,
		scrollToNote,
		drillDownNote,
		showEditThread, closeEditThread, show_edit_thread,
		win_height, win_width
	}

});