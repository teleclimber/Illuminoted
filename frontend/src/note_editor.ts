import {ref, computed} from 'vue';
import type {Ref} from 'vue';

import { notes_graph } from './main';

export default class NoteEditorVM {
	ref_note_id: Ref<number|undefined> = ref();
	relation: Ref<"follows"|"thread-out"> = ref("follows");



	ref_note = computed( () => {
		if( this.ref_note_id.value === undefined ) return undefined;
		return notes_graph.mustGetNote(this.ref_note_id.value);
	});

	thread = computed( () => {
		if( this.relation.value !== 'follows' || this.ref_note.value === undefined ) return undefined;
		return notes_graph.mustGetThread(this.ref_note.value.thread);
	});

	// editable refs:
	contents = ref('');
	// relations...

	follow(ref_note_id:number) {
		this.relation.value = "follows";
		this.ref_note_id.value = ref_note_id;
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

	saveNote() {
		this.contents.value = this.contents.value.trim();
		if( this.contents.value === '' ) {
			alert("Can't save empty note");
			return;
		}

	}
}