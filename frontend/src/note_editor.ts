import { reactive, ref, computed } from 'vue';
import type {Ref} from 'vue';
import { defineStore } from 'pinia';

import { useNotesGraphStore } from './models/graph';
import {EditRel, typedLabel} from './models/graph';

export const useNoteEditorStore = defineStore('note-editor', () => {
	const notesStore = useNotesGraphStore();

	const show = ref(false);
	const edit_note_id: Ref<number|undefined> = ref();

	const has_data = computed( () => {
		return !!edit_note_id.value || !!thread_id.value || !!rel_edit.length;
	});

	const created_time = ref(new Date().getTime());

	// editable refs:
	const thread_id: Ref<number|undefined> = ref();		// current note's thread or parent thread if creating new thread
	const create_new_thread = ref(false);
	const new_thread_name = ref('');
	const contents = ref('');
	
	// relations
	const rel_edit :EditRel[] = reactive([]);

	// initialiazation functions:
	function appendToThread(t_id:number) {
		if( show.value ) return;
		reset();
		thread_id.value = t_id;
		created_time.value = new Date().getTime();
		show.value = true;
	}
	function threadOut(from_note_id:number) {
		if( show.value ) return;
		reset();
		// get note, then parent thread is note thread.
		const parent_note = notesStore.mustGetNote(from_note_id);
		create_new_thread.value = true;
		thread_id.value = parent_note.value.thread;
		rel_edit.push({
			note_id: from_note_id,
			label: 'thread-out',
			action: 'add'
		});
		created_time.value = new Date().getTime();
		show.value = true;
	}
	function editNote(note_id:number) {
		if( show.value ) return;
		reset();
		
		const note = notesStore.mustGetNote(note_id).value;
		edit_note_id.value = note_id;

		thread_id.value = note.thread;

		note.relations.forEach( r => {
			if( r.source === note.id ) {
				rel_edit.push({
					action:'',
					label: r.label,
					note_id: r.target
				});
			}
		});

		contents.value = note.contents;

		created_time.value = note.created.getTime();
		show.value = true;
	}
	function reset() {
		edit_note_id.value = undefined;
		thread_id.value = undefined;
		contents.value = "";
		while(rel_edit.pop()) {};
		create_new_thread.value = false;
		new_thread_name.value = '';
		show.value = false;
	}

	function createNewThread() {
		if( !show.value ) return;	// This should only get called when in the midst of editing a note or creating one
		create_new_thread.value = true;
	}
	function useExistingThread() {
		if( !show.value ) return;
		create_new_thread.value = false;
	}

	function editRelation(note_id:number, l:string, on:boolean) {
		const label = typedLabel(l);
		if( !label ) throw new Error("what is this label? "+l);
		if( label === 'thread-out' ) return;
		const existing_i = rel_edit.findIndex(d => d.note_id === note_id && d.label === label);
		const existing = rel_edit[existing_i];
		if( on ) {
			if( existing ) {
				if( existing.action === 'delete' ) existing.action = '';
				else throw new Error('unexpected situation for on: '+existing.action);
			}
			else rel_edit.push({action:'add', label, note_id})
		}
		else {
			if( existing ) {
				if( existing.action === '' ) existing.action = 'delete';
				else if( existing.action === 'add' ) {
					rel_edit.splice(existing_i, 1);
				}
				else throw new Error('unexpected situation for off: '+existing.action);
			}
			else throw new Error("trying to remove relation that we don't have.")
		}
	}

	const ok_to_save = computed( () => {
		if( create_new_thread.value && new_thread_name.value === '' ) return false;
		if( thread_id.value === undefined ) return false;
		// what else? empty note?
		return true;
	});

	async function  saveNote() {
		contents.value = contents.value.trim();
		if( contents.value === '' ) {
			alert("Can't save empty note");
			return;
		}

		if( edit_note_id.value !== undefined ) {
			if( thread_id.value === undefined ) throw new Error("thread_id should not be false here.");
			if( create_new_thread.value && new_thread_name.value === '' ) return false;
			await notesStore.updateNote(edit_note_id.value, thread_id.value, contents.value, rel_edit, new Date,
				create_new_thread.value ? new_thread_name.value : undefined);
		}
		else {
			if( thread_id.value === undefined ) throw new Error("thread_id should not be false here.");
			if( create_new_thread.value && new_thread_name.value === '' ) return false;
			await notesStore.createNote(thread_id.value, contents.value, rel_edit, new Date, 
				create_new_thread.value ? new_thread_name.value : undefined);
		}

		// if all went well reset
		reset();
	}

	return {
		show,
		rel_edit,
		has_data,
		edit_note_id,
		created_time,
		thread_id, contents, 
		appendToThread,
		threadOut,
		editNote, editRelation,
		ok_to_save, saveNote,
		reset,
		create_new_thread, createNewThread, useExistingThread, new_thread_name
	}
});