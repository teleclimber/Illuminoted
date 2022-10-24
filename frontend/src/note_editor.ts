import {ref, computed} from 'vue';
import type {Ref} from 'vue';

import { notes_graph } from './main';

export default class NoteEditorVM {
	edit_note_id: Ref<number|undefined> = ref();
	thread_id: Ref<number|undefined> = ref();
	parent_id: Ref<number|undefined> = ref();

	thread = computed( () => {
		if( this.thread_id.value === undefined ) return undefined;
		return notes_graph.mustGetThread(this.thread_id.value);
	});
	rel = computed( () => {
		if( this.thread_id.value ) return "follows";
		if( this.parent_id.value ) return "thread-out"
		return "";
	});
	has_data = computed( () => {
		return this.edit_note_id.value || this.thread_id.value || this.parent_id.value;
		// also relations
	})

	// editable refs:
	contents = ref('');
	// relations...

	appendToThread(thread_id:number) {
		this.parent_id.value = undefined;
		this.thread_id.value = thread_id;
	}
	threadOut(parent_id:number) {
		this.parent_id.value = parent_id;
		this.thread_id.value = undefined;
	}
	editNote(note_id:number) {
		// have to get the note
		const note = notes_graph.mustGetNote(note_id).value;
		this.edit_note_id.value = note_id;
		if( note.thread === note.id ) {
			// have to get parent
			const rel = note.relations.find( r => {
				return r.label === 'thread-out' && r.source === note.id;
			});
			if( rel ) this.parent_id.value = rel.target;
		}
		else {
			this.thread_id.value = note.thread;
		}
		this.contents.value = note.contents;
		// relations, etc...

	}
	reset() {
		this.edit_note_id.value = undefined;
		this.thread_id.value = undefined;
		this.parent_id.value = undefined;
		this.contents.value = "";
		// relations..
	}

	async saveNote() {

		this.contents.value = this.contents.value.trim();
		if( this.contents.value === '' ) {
			alert("Can't save empty note");
			return;
		}

		if( this.edit_note_id.value !== undefined ) {
			await notes_graph.updateContent(this.edit_note_id.value, this.contents.value);
		}
		else {
			const ref_id = this.thread_id.value || this.parent_id.value;
			if( ref_id === undefined || this.rel.value === "" ) throw new Error("Unable to save note because ref id or rel are falsy");

			await notes_graph.createNote(ref_id, this.rel.value, this.contents.value, new Date);
		}

		// if all went well reset
		this.reset();
	}
}