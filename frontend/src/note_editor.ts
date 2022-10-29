import { reactive, ref, computed, ComputedRef} from 'vue';
import type {Ref} from 'vue';

import { notes_graph } from './main';
import {EditRel, typedLabel} from './models/graph';

export default class NoteEditorVM {
	edit_note_id: Ref<number|undefined> = ref();
	thread_id: Ref<number|undefined> = ref();
	fallback_thread_id :number|undefined;

	thread = computed( () => {
		if( this.thread_id.value === undefined ) return undefined;
		return notes_graph.mustGetThread(this.thread_id.value);
	});

	has_data = computed( () => {
		return !!this.edit_note_id.value || !!this.thread_id.value || !!this.rel_edit.length;
	});

	created_time = ref(new Date().getTime());

	// editable refs:
	contents = ref('');
	
	// relations
	rel_edit :EditRel[] = reactive([]);

	appendToThread(thread_id:number) {
		this.reset();
		this.thread_id.value = thread_id;
		this.created_time.value = new Date().getTime();
	}
	threadOut(parent_id:number, fallback_thread_id:number) {
		this.reset();
		this.fallback_thread_id = fallback_thread_id;
		this.rel_edit.push({
			note_id: parent_id,
			label: 'thread-out',
			action: 'add'
		});
		this.created_time.value = new Date().getTime();
	}
	editNote(note_id:number) {
		// have to get the note
		const note = notes_graph.mustGetNote(note_id).value;
		this.edit_note_id.value = note_id;

		if( note.thread !== note.id ) {
			this.thread_id.value = note.thread;
		}

		note.relations.forEach( r => {
			if( r.source === note.id ) {
				this.rel_edit.push({
					action:'',
					label: r.label,
					note_id: r.target
				});
			}
		});

		this.contents.value = note.contents;

		this.created_time.value = note.created.getTime();
	}
	reset() {
		this.edit_note_id.value = undefined;
		this.thread_id.value = undefined;
		this.contents.value = "";
		while(this.rel_edit.pop()) {};
		this.fallback_thread_id = undefined;
	}

	editRelation(note_id:number, l:string, on:boolean) {
		const label = typedLabel(l);
		if( !label ) throw new Error("what is this label? "+l);
		if( label === 'thread-out' ) return;
		const existing_i = this.rel_edit.findIndex(d => d.note_id === note_id && d.label === label);
		const existing = this.rel_edit[existing_i];
		if( on ) {
			if( existing ) {
				if( existing.action === 'delete' ) existing.action = '';
				else throw new Error('unexpected situation for on: '+existing.action);
			}
			else this.rel_edit.push({action:'add', label, note_id})
		}
		else {
			if( existing ) {
				if( existing.action === '' ) existing.action = 'delete';
				else if( existing.action === 'add' ) {
					this.rel_edit.splice(existing_i, 1);
				}
				else throw new Error('unexpected situation for off: '+existing.action);
			}
			else throw new Error("trying to remove relation that we don't have.")
		}
	}

	async saveNote() {
		this.contents.value = this.contents.value.trim();
		if( this.contents.value === '' ) {
			alert("Can't save empty note");
			return;
		}

		if( this.edit_note_id.value !== undefined ) {
			await notes_graph.updateNote(this.edit_note_id.value, this.contents.value, this.rel_edit, new Date);
		}
		else {
			await notes_graph.createNote(this.thread_id.value, this.contents.value, this.rel_edit, new Date);
		}

		// if all went well reset
		this.reset();
	}
}