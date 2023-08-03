import { defineStore } from 'pinia';
import { watch, reactive, computed, Ref, ref } from 'vue';
import { useUIStateStore } from './ui_state';
import { useNotesGraphStore } from './graph';

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

	watch( uiStateStore.selected_threads, () => {
		target_note_id = undefined;
		const target = getTargetFromVisible();
		if( target ) target_date = target;
		resetScroll();
		if( target_date ) notesStore.getNotesAroundDate(target_date);
		else notesStore.reloadNotes();
	});

	function goToDate(d: Date) {
		target_note_id = undefined;
		target_date = d;
		resetScroll();
		notesStore.getNotesAroundDate(d);
	}

	function goToNote(id:number) {
		// first determine if the note is loaded or not
		// if loaded, scroll to it.
		// If not loaded consider loading the note and adjacent notes?
		// then upon loading have to scroll to it and highlight.
		// Worried how this will end up feeling UX wise. It may be jarring to get a whole new stack just to see a note.
		// .. and how do you go back to where you were after seeing that note?
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
		getTargetDate, getTargetNoteID,
		reset_scroll_ticker
	};

});