import {ref, computed} from 'vue';
import type {Ref} from 'vue';

import { notes_graph } from './main';

export default class NoteEditorVM {
	ref_note_id: Ref<number|undefined> = ref();	// it's parent note if new thread, thread id if appending
	relation: Ref<""|"follows"|"thread-out"> = ref("");

	thread = computed( () => {
		if( this.relation.value !== 'follows' || this.ref_note_id.value === undefined ) return undefined;
		return notes_graph.mustGetThread(this.ref_note_id.value);
	});

	// editable refs:
	contents = ref('');
	// relations...

	appendToThread(thread_id:number) {
		this.relation.value = "follows";
		this.ref_note_id.value = thread_id;
	}
	threadOut(ref_note_id:number) {
		this.relation.value = "thread-out";
		this.ref_note_id.value = ref_note_id;
	}
	reset() {
		this.ref_note_id.value = undefined;
	}

	getRel(note_id:number) : ""|"follows"|"thread-out" {
		if( !this.ref_note_id.value ) return "";
		if( this.ref_note_id.value === note_id ) return this.relation.value;
		return "";
	}

	async saveNote() {
		if( !this.ref_note_id.value || this.relation.value === "") return;

		this.contents.value = this.contents.value.trim();
		if( this.contents.value === '' ) {
			alert("Can't save empty note");
			return;
		}

		const ref_id = this.relation.value === 'follows' ? this.thread.value?.thread : this.ref_note_id.value;
		if( !ref_id ) throw new Error("expected a ref_id");

		await notes_graph.createNote(ref_id, this.relation.value, this.contents.value, new Date);

		// if all went well reset
		this.reset();
	}
}