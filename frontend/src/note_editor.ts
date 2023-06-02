import { reactive, ref, computed, ComputedRef} from 'vue';
import type {Ref} from 'vue';
import { defineStore } from 'pinia';

import { useNotesGraphStore } from './models/graph';
import {EditRel, typedLabel} from './models/graph';
import { useThreadsStore } from './models/threads';

export const useNoteEditorStore = defineStore('note-editor', () => {
	const notesStore = useNotesGraphStore();
	const threadsStore = useThreadsStore();

	const edit_note_id: Ref<number|undefined> = ref();
	const thread_id: Ref<number|undefined> = ref();
	let fallback_thread_id :number|undefined;

	const thread = computed( () => {
		if( thread_id.value === undefined ) return undefined;
		return threadsStore.mustGetThread(thread_id.value);
	});

	const has_data = computed( () => {
		return !!edit_note_id.value || !!thread_id.value || !!rel_edit.length;
	});

	const created_time = ref(new Date().getTime());

	// editable refs:
	const contents = ref('');
	
	// relations
	const rel_edit :EditRel[] = reactive([]);

	function appendToThread(t_id:number) {
		reset();
		thread_id.value = t_id;
		created_time.value = new Date().getTime();
	}
	function threadOut(parent_id:number, fallback_thread_id:number) {
		reset();
		fallback_thread_id = fallback_thread_id;
		rel_edit.push({
			note_id: parent_id,
			label: 'thread-out',
			action: 'add'
		});
		created_time.value = new Date().getTime();
	}
	function editNote(note_id:number) {
		// have to get the note
		const note = notesStore.mustGetNote(note_id).value;
		edit_note_id.value = note_id;

		if( note.thread !== note.id ) {
			thread_id.value = note.thread;
		}

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
	}
	function reset() {
		edit_note_id.value = undefined;
		thread_id.value = undefined;
		contents.value = "";
		while(rel_edit.pop()) {};
		fallback_thread_id = undefined;
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

	async function  saveNote() {
		contents.value = contents.value.trim();
		if( contents.value === '' ) {
			alert("Can't save empty note");
			return;
		}

		if( edit_note_id.value !== undefined ) {
			await notesStore.updateNote(edit_note_id.value, contents.value, rel_edit, new Date);
		}
		else {
			await notesStore.createNote(thread_id.value, contents.value, rel_edit, new Date);
		}

		// if all went well reset
		reset();
	}

	return {
		rel_edit,
		has_data,
		edit_note_id,
		created_time,
		thread, contents, 
		appendToThread,
		threadOut,
		editNote, editRelation,
		saveNote,
		reset
	}
});