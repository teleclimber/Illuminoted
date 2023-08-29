import {computed, ref, shallowRef, reactive} from 'vue';
import type {Ref, ComputedRef} from 'vue';
import { defineStore } from 'pinia';
import { useUIStateStore } from './ui_state';
import { useThreadsStore } from './threads';

export type RelationLabel = 'thread-out' | 'in-reply-to' | 'see-also';
export const rel_labels :RelationLabel[] = ['thread-out', 'in-reply-to', 'see-also'];

export interface Relation {
	source: number,
	target: number,
	label: RelationLabel,
	created: Date
}

// Edit Rel assumes that the note_id is the target, and the note being edited is the source.
// ^^ that sounds iffy perhaps?
export type EditRel = {
	action: '' | 'delete' | 'add',
	label: RelationLabel,
	note_id: number
}

export interface NoteData {
	id: number,
	thread: number,
	contents: string,
	created: Date
}

export interface Note extends NoteData {
	relations: Relation[]
}

export type Thread = {
	id: number,
	parent: number|undefined,
	contents: string,
	created: Date,
	children: Thread[]
}

export const useNotesGraphStore = defineStore('notes-graph', () => {
	const uiStateStore = useUIStateStore();
	const threadsStore = useThreadsStore();

	const context_id = ref(1);
	let earliest :Date|undefined;
	let latest :Date|undefined;

	const search_term = ref('');

	const notes :Ref<Map<number,Ref<Note>>> = shallowRef(new Map);

	function setContext(id:number) {
		context_id.value = id;
		earliest = undefined;
		latest = undefined;
	}

	function reloadNotes() {
		notes.value = new Map;
		earliest = undefined;
		latest = undefined;
		getMoreNotesBefore();
	}

	let search_timeout:number|undefined = undefined;
	function setSearchTerm(s:string) {
		search_term.value = s;
		if( search_timeout ) clearTimeout(search_timeout);
		search_timeout = setTimeout( () => reloadNotes(), 150 );
	}

	async function getNotesAroundDate(around_date: Date) {
		notes.value = new Map;
		earliest = undefined;
		latest = undefined;
		loadNotes(around_date, "split", search_term.value);
	}

	async function getMoreNotesBefore() {
		await loadNotes(earliest, "before", search_term.value);
	}
	async function getMoreNotesAfter() {
		await loadNotes(latest, "after", search_term.value);
	}

	const loading = ref(false);
	async function loadNotes(date:Date|undefined, direction:"before"|"after"|"split", search_term:string) {
		if( loading.value ) return;	// throw new Error("notes are currently being loaded");
		loading.value = true;
		const resp = await fetch('/api/notes/?'
			+ new URLSearchParams({
				threads: Array.from(uiStateStore.selected_threads).join(','),
				date: date ? date.toISOString() : '',
				direction,
				search: search_term
			}));
		if( !resp.ok ) throw new Error("fetch not OK");
		const data = <{relations: any[], notes: any[]}>await resp.json();
		if( !Array.isArray(data.relations) ) throw new Error("expected an array of relations");
		const relations = data.relations.map( (r:any) => relationFromRaw(r) );
		if( !Array.isArray(data.notes) ) throw new Error("expected array of notes");
		const new_note_datas = data.notes.map( (n:any) => noteFromRaw(n) );

		if( new_note_datas.length ) {
			new_note_datas.sort( (a, b) => a.created < b.created ? -1 : 1);
			const new_earliest = new Date(new_note_datas[0].created);
			if( !earliest || new_earliest < earliest ) earliest = new_earliest;
			const new_latest = new Date(new_note_datas[new_note_datas.length -1].created);
			if( !latest || new_latest > latest ) latest = new_latest;
		}
		
		const temp_notes = new Map(notes.value);
		new_note_datas.forEach( n => {
			const n2 = <Note>n;
			n2.relations = [];
			temp_notes.set(n.id, shallowRef(n2));
		});
		relations.forEach( r => {
			let note = temp_notes.get(r.source);
			if( note ) addRelation(note, r);
			note = temp_notes.get(r.target);
			if( note ) addRelation(note, r);
		});

		notes.value = temp_notes;
		loading.value = false;
	}

	const sorted_notes :ComputedRef<Ref<Note>[]> = computed( () => {
		return Array.from(notes.value, ([_, t]) => t).sort( (a, b) => a.value.created < b.value.created ? -1 : 1);
	});

	function getNote(id:number) :Ref<Note>|undefined {
		return notes.value.get(id);
	}
	function mustGetNote(id:number) :Ref<Note> {
		const n = getNote(id);
		if( !n ) throw new Error("could not find note "+id);
		return n;
	}
	function lazyGetNote(id:number) :Ref<Note|undefined> {
		const n = getNote(id);
		if( n ) return ref(n);

		const ret :Ref<Note|undefined> = ref(undefined);
		getLoadNote(id).then( n_ref => {
			ret.value = n_ref.value;
		});
		return ret;
	}
	async function getLoadNote(id:number) :Promise<Ref<Note>> {	// or you could return a Ref with a "loading" flag?
		const n = getNote(id);
		if( n ) return n;

		const resp = await fetch('/api/notes/'+id);
		if( !resp.ok ) throw new Error("fetch not OK");
		const data = <{relations: any[], note: any}>await resp.json();
		if( !Array.isArray(data.relations) ) throw new Error("expected an array of relations");
		const temp_notes = new Map(notes.value);
		const note_data = noteFromRaw(data.note);
		const n2 = <Note>note_data;
		n2.relations = data.relations.map( (r:any) => relationFromRaw(r) );
		const note_ref = shallowRef(n2);
		temp_notes.set(n2.id, note_ref);
		notes.value = temp_notes;
		return note_ref;
	}

	// create a note. 
	// thread_id is the thead of the note, or if creating a new thread, it's the parent thread.
	async function createNote(thread_id:number, contents:string, rel_deltas:EditRel[], created:Date, new_thread_name?:string) {
		// create a note by sending data to server
		// Get back note id, thread, etcc., and update local data
		// Also may need to update thread
		
		const rawResponse = await fetch('/api/notes', {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				thread_id,
				contents: contents,
				created: created,
				rel_deltas: rel_deltas,
				new_thread_name
			})
		});

		const resp = await rawResponse.json();
		if( !resp.note_id ) throw new Error("I expected to get a note_id "+resp);
		const new_note_id = Number(resp.note_id);

		if( new_thread_name ) {
			if( !resp.thread_id ) throw new Error("I expected to get a thread_id "+resp);
			// create thread with thread_id as parent
			// then set thread_id to new.
			threadsStore.addExternallyCreatedThread(resp.thread_id, thread_id, new_thread_name, created);
			thread_id = resp.thread_id;
		}

		const new_note:Note = {
			id: new_note_id,
			thread: thread_id,
			contents,
			created,
			relations: []
		};

		applyRelDeltas(new_note, created, rel_deltas);

		const temp_notes = new Map(notes.value);
		temp_notes.set(new_note_id, shallowRef(new_note));
		notes.value = temp_notes;
	}

	async function updateNote(note_id:number, thread_id:number, contents:string, rel_deltas:EditRel[], modified:Date, new_thread_name?:string ) {
		rel_deltas = rel_deltas.filter( d => d.action === 'add' || d.action === 'delete');

		const rawResponse = await fetch('/api/notes/'+note_id, {
			method: 'PATCH',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				note_id,
				thread_id,
				contents,
				rel_deltas,
				modified,
				new_thread_name
			})
		});

		if( rawResponse.status !== 200 ) {
			alert("Got error trying to update contents");
		}

		const resp = await rawResponse.json();

		if( new_thread_name ) {
			if( !resp.thread_id ) throw new Error("I expected to get a thread_id "+resp);
			// create thread with thread_id as parent then set thread_id to new.
			threadsStore.addExternallyCreatedThread(resp.thread_id, thread_id, new_thread_name, modified);
			thread_id = resp.thread_id;
		}
		
		const note_ref = mustGetNote(note_id);
		note_ref.value.contents = contents;
		note_ref.value.thread = thread_id;
		applyRelDeltas(note_ref.value, modified, rel_deltas);
		note_ref.value = Object.assign({}, note_ref.value);
	}

	function applyRelDeltas(source_note:Note, created: Date, rel_deltas:EditRel[]) {
		const source = source_note.id;
		rel_deltas.forEach( d => {
			const rel = {
				source,
				target: d.note_id,
				label: d.label,
				created,
			};
			if( d.action === 'add' ) {
				source_note.relations.push(rel);
				const target_note = getNote(d.note_id);
				if( target_note ) {
					addRelation(target_note, rel);
				}
			}
			else if( d.action === 'delete' ) {
				const i = source_note.relations.findIndex( r => relationEqual(r, rel));
				if( i == -1 ) throw new Error("unable to find relation to remove");
				source_note.relations.splice(i, 1);
				const target_note = getNote(d.note_id);
				if( target_note ) {
					removeRelation(target_note, rel);
				}
			}
		});
	}

	return {
		setContext,
		sorted_notes,
		search_term, setSearchTerm,
		getNote, mustGetNote, lazyGetNote, getLoadNote,
		updateNote, createNote,
		loading,
		getMoreNotesBefore, getMoreNotesAfter, getNotesAroundDate,
		reloadNotes
	}
});

function relationFromRaw(r:any) :Relation {
	const label = typedLabel(r.label);
	if( !label ) throw new Error("bad relation label: "+r.label);
	return {
		created: new Date(r.created),
		label,
		source: parseInt(r.source),
		target: parseInt(r.target)
	};
}
function noteFromRaw(n:any) :NoteData {
	return {
		id: parseInt(n.id),
		thread: parseInt(n.thread),
		created: new Date(n.created),
		contents: n.contents+''
	};
}

function addRelation(n:Ref<Note>, r:Relation) {
	const existingI = n.value.relations.findIndex( (existing) => relationEqual(existing, r) );
	if( existingI !== -1 ) {
		const existing = n.value.relations[existingI];
		if( existing.created.getTime() !== r.created.getTime() ) {
			// relation was updated
			n.value.relations[existingI] = r;
			n.value = Object.assign({}, n.value);
		}
	}
	else {
		n.value.relations.push(r);
		n.value = Object.assign({}, n.value);
	}
}
function removeRelation(n:Ref<Note>, r:Relation) {
	const existingI = n.value.relations.findIndex( (existing) => relationEqual(existing, r) );
	if( existingI !== -1 ) {
		n.value.relations.splice(existingI, 1);
		n.value = Object.assign({}, n.value);
	}
}

// ont he backend the unique constriaint is: 
// UNIQUE(source, target, label) ON CONFLICT REPLACE,
// Therefore we can check for "equal" by looking at these three.
function relationEqual( a:Relation, b:Relation) :boolean {
	return a.source === b.source && a.target === b.target && a.label === b.label;
}

export function typedLabel(l:string) :RelationLabel|undefined {
	return rel_labels.find( lt => lt === (l as RelationLabel));
}


// function threadFromRaw(n:any) :Thread|undefined {
// 	if( !n ) return undefined;
// 	return {
// 		id: parseInt(n.id),
// 		thread: parseInt(n.thread),
// 		is_leaf: !!n.is_leaf,
// 		created: new Date(n.created),
// 		contents: n.contents+''
// 	};
// }