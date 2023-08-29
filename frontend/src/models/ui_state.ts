import {computed, ref, shallowRef, reactive, toRaw} from 'vue';
import type {Ref, ComputedRef} from 'vue';
import { defineStore } from 'pinia';
import { useNotesGraphStore } from './graph';
import { useThreadsStore } from './threads';

type State = {
	selected_threads: Set<number>,
}

export const useUIStateStore = defineStore('ui-state', () => {
	const threadsStore = useThreadsStore();
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
	}
	const show_search = computed( () => {
		return _show_search.value;
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
		selected_threads.add(id);
		updateUrlParams()
	}
	function deselectThread(id:number) {
		selected_threads.delete(id);
		updateUrlParams()
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

	function updateUrlParams() {
		let url = `?threads=${Array.from(selected_threads).join(',')}`;
		const s :State = {
			selected_threads: toRaw(selected_threads)	
		}
		history.pushState(s, '', url);
	}
	function readUrlParams() :State {
		const ret :State = {
			selected_threads: new Set
		};
		const params = new URLSearchParams(document.location.search);
		const threads_str = params.get("threads");
		if( threads_str ) threads_str.split(",").forEach( t => ret.selected_threads.add(Number(t)));

		return ret;
	}
	addEventListener("popstate", (event) => {
		console.log("pop state", event);
		selected_threads.clear();
		const state = readUrlParams();
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
	});

	function initDataFromURL() {
		// if there are threads in URL, then load those.
		// if not select 1 and get latest threads.
		const state = readUrlParams();
		if( state.selected_threads.size ) {
			state.selected_threads.forEach( t => selected_threads.add(t) );
			threadsStore.loadThreads(1, selected_threads).then( (threads) => {
				batchExpandThreads(threads);
			});
		}
		else {
			selected_threads.add(_context_id.value);	//basically thread 1
			threadsStore.getLatestSubThreads(1, 10).then( (threads) => {
				batchExpandThreads(threads);
			});
		} 
	}

	return {
		selected_threads, expanded_threads,
		threadClicked, selectThread, deselectThread, toggleExpandedThread, batchExpandThreads,
		initDataFromURL, context_id,
		show_threads, showThreads, hideThreads,
		threads_pinnable, pin_threads, pinThreads, unPinThreads, threads_width,
		show_search, showSearch, hideSearch,
		selected_note_id, selectNote, deselectNote,
		scrollToNote,
		showEditThread, closeEditThread, show_edit_thread,
		win_height, win_width
	}

});