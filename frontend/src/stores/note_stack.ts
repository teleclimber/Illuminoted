import { defineStore } from 'pinia';
import { watch, reactive, computed, toRaw, ref } from 'vue';
import { useUIStateStore } from './ui_state';
import { NoteParams, useNotesGraphStore } from './graph';

export const useNoteStackStore = defineStore('note-stack', () => {
	const uiStateStore = useUIStateStore();
	const notesStore = useNotesGraphStore();

	let target_date :Date|undefined;
	let target_note_id :number|undefined;
	function getTargetDate() {
		return target_date;
	}
	function getTargetNoteID() {
		return target_note_id;
	}

	const reset_scroll_ticker = ref(1);
	function resetScroll() {
		console.log("resetting scroll");
		reset_scroll_ticker.value = reset_scroll_ticker.value +1;
	}

	function reloadNotes() {
		resetScroll();
		const params:NoteParams = {
			search:uiStateStore.debounced_search,
			threads: uiStateStore.all_threads ? "all" : toRaw(uiStateStore.selected_threads)
		};
		if( target_date ) notesStore.loadNotesAroundDate(params, target_date);
		else if( target_note_id ) notesStore.loadNotesAroundNote(params, target_note_id);
		else notesStore.loadLatestNotes(params);
	}

	function goToDate(d: Date) {
		setTargetDate(d);
		resetScroll();
		reloadNotes();
	}

	function goToNote(id:number) {
		setTargetNote(id);
		resetScroll();
		reloadNotes();
	}

	function setTargetNote(id:number) {
		target_note_id = id;
		target_date = undefined;
	}
	function setTargetDate(d:Date) {
		target_note_id = undefined;
		target_date = d;
	}
	function setTargetDateToVisible() {
		target_note_id = undefined;
		target_date = undefined;
		const target = getTargetFromVisible();
		if( target ) target_date = target;
	}

	// Need a function that sets current focus date / note.
	const visible_note_ids :Set<number> = reactive(new Set);
	function setNoteVisible(note_id: number) {
		visible_note_ids.add(note_id);
	}
	function setNoteInvisible(note_id: number) {
		visible_note_ids.delete(note_id);
	}
	const visible_date_range = computed( () => {
		let from :Date|undefined;
		let to :Date|undefined;
		visible_note_ids.forEach( id => {
			const note = notesStore.getNote(id);
			if( note === undefined ) return;
			const created = note.value.created;
			if( !from || created < from ) from = created;
			if( !to || created > to ) to = created;
		});
		//console.log(visible_note_ids, from , to);
		return {from, to};
	});
	// getVisible returns a new array with note id and date that are visible
	function getTargetFromVisible() {
		if( visible_note_ids.size === 0 ) return undefined;
		const dates :Date[] = [];
		visible_note_ids.forEach( id => {
			const note = notesStore.getNote(id);
			if( note === undefined ) return;
			dates.push(note.value.created);
		});
		dates.sort( (a, b) => a < b ? -1 : 1 );
		const i = Math.ceil(dates.length/2);
		console.log("target date", dates[i]);
		return dates[i];
	}

	return {
		goToDate, goToNote,
		setNoteVisible, setNoteInvisible,
		visible_date_range,
		reloadNotes,
		setTargetNote, setTargetDate, setTargetDateToVisible,
		getTargetDate, getTargetNoteID,
		reset_scroll_ticker
	};

});