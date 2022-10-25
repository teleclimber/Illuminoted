import {computed, ref, shallowRef, reactive} from 'vue';
import type {Ref, ComputedRef} from 'vue';


export interface Relation {
	source: number,
	target: number,
	label: string,
	created: Date
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

export class NotesGraph {

	context_id = ref(1);
	loaded_from = '';

	threads :Ref<Map<number,Thread>> = shallowRef(new Map); 
	notes :Ref<Map<number,Ref<Note>>> = shallowRef(new Map);

	selected_threads :Set<number> = reactive( new Set);	// set of thread_ids for which we want to show notes
	expanded_threads :Set<number> = reactive( new Set);	// set of thread_ids for which we show the children

	context_thread = computed( () => {
		return this.getThread(this.context_id.value);
	});

	setContext(id:number) {
		this.context_id.value = id;
		this.threads.value = new Map;
		this.loaded_from = '';
		this.selected_threads.add(id);
		this.getThreads();
	}

	selectThread(id:number) {
		this.selected_threads.add(id);
		this.reloadNotes();
	}
	deselectThread(id:number) {
		this.selected_threads.delete(id);
		this.reloadNotes();
	}
	reloadNotes() {
		this.notes.value = new Map;
		this.loaded_from = '';
		this.getMoreNotes();
	}

	toggleExpandedThread(id:number) {
		if( this.expanded_threads.has(id) ) this.expanded_threads.delete(id);
		else this.expanded_threads.add(id);
	}

	async getMoreNotes() {
		const resp = await fetch('/api/notes/?'
			+ new URLSearchParams({
				threads: Array.from(this.selected_threads).join(','),
				date: this.loaded_from
			}));
		if( !resp.ok ) throw new Error("fetch not OK");
		const data = <{relations: any[], notes: any[]}>await resp.json();
		if( !Array.isArray(data.relations) ) throw new Error("expected an array of relations");
		const relations = data.relations.map( (r:any) => relationFromRaw(r) );
		if( !Array.isArray(data.notes) ) throw new Error("expected array of notes");
		const new_note_datas = data.notes.map( (n:any) => noteFromRaw(n) );

		// Currently notes are returned sorted crhonological, so last one is oldest, so use that as loaded from.
		// Whe we put different sort order in request, adust this.
		this.loaded_from = new Date(new_note_datas[new_note_datas.length -1].created).toISOString();
		
		const temp_notes = new Map(this.notes.value);
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

		this.notes.value = temp_notes;
	
		// const new_notes = <Note[]> new_note_datas;
		// new_notes.sort( (a, b) => a.created < b.created ? -1 : 1);

		// if( this.notes.value.length !== 0 ) {
		// 	const first = this.notes.value[0];
		// 	while( new_notes.length !== 0 && new_notes[new_notes.length-1].created > )
		// }

		// this.notes.value = ret;	// later merge and deduplicate, etc...?
		// this.notes.value.sort( (a, b) => a.created < b.created ? -1 : 1);
	
		// console.log("notes with relations: ", this.notes);
	}

	sorted_notes :ComputedRef<Ref<Note>[]> = computed( () => {
		return Array.from(this.notes.value, ([_, t]) => t).sort( (a, b) => a.value.created < b.value.created ? -1 : 1);
	});

	getNote(id:number) :Ref<Note>|undefined {
		return this.notes.value.get(id);
	}
	mustGetNote(id:number) :Ref<Note> {
		const n = this.getNote(id);
		if( !n ) throw new Error("could not find note "+id);
		return n;
	}
	lazyGetNote(id:number) :Ref<Note|undefined> {
		const n = this.getNote(id);
		if( n ) return ref(n);

		const ret :Ref<Note|undefined> = ref(undefined);
		this.getLoadNote(id).then( n_ref => {
			ret.value = n_ref.value;
		});
		return ret;
	}
	async getLoadNote(id:number) :Promise<Ref<Note>> {	// or you could return a Ref with a "loading" flag?
		const n = this.getNote(id);
		if( n ) return n;

		const resp = await fetch('/api/notes/'+id);
		if( !resp.ok ) throw new Error("fetch not OK");
		const data = <{relations: any[], note: any}>await resp.json();
		if( !Array.isArray(data.relations) ) throw new Error("expected an array of relations");
		const temp_notes = new Map(this.notes.value);
		const note_data = noteFromRaw(data.note);
		const n2 = <Note>note_data;
		n2.relations = data.relations.map( (r:any) => relationFromRaw(r) );
		const note_ref = shallowRef(n2);
		temp_notes.set(n2.id, note_ref);
		this.notes.value = temp_notes;
		return note_ref;
	}

	async createNote(ref_note_id:number, relation:"follows"|"thread-out", contents:string, created:Date) {
		// create a note by sending data to server
		// Get back note id, thread, etcc., and update local data
		// Also may need to update thread
		// 	
		
		const rawResponse = await fetch('/api/notes', {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				ref_note_id: ref_note_id,
				relation: relation,
				contents: contents,
				created: created,
				targets: []	// todo later
			})
		});

		const resp = await rawResponse.json();
		const new_id = Number(resp.id);
		const new_note:Note = {
			id: new_id,
			thread: ref_note_id,	// assumes follows
			contents,
			created,
			relations: []
		}

		if( relation === "thread-out" ) {
			new_note.thread = new_note.id;
			const ref_note = this.mustGetNote(ref_note_id);
			const parent_thread = this.mustGetThread(ref_note.value.thread);
			const new_thread :Thread = {
				id: new_id,
				contents,
				created,
				parent: parent_thread.id,
				children: []
			}
			parent_thread.children.push(new_thread);
			const temp_threads = new Map(this.threads.value);
			temp_threads.set(new_id, new_thread);
			this.threads.value = temp_threads;

			this.selected_threads.add(new_id);	// by default the newly created thread is selected

			const r = {
				source: new_id,
				target: ref_note.value.id,
				label: "thread-out",
				created,
			};
			addRelation(ref_note, r);
			new_note.relations.push(r)
		}

		const temp_notes = new Map(this.notes.value);
		temp_notes.set(new_id, shallowRef(new_note));
		this.notes.value = temp_notes;

	}

	async updateContent(note_id:number, contents:string) {
		// We can just sned everything up to server and wait for an OK.
		// Except relations should be in form of a delta.
		// Also maybe don't try to update contents nless it's changed?
		// Perhaps it's better to think of "edit" as editing content and editing relations separately?

		const rawResponse = await fetch('/api/notes/'+note_id, {
			method: 'PATCH',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				note_id,
				contents,
			})
		});


		if( rawResponse.status !== 200 ) {
			alert("Got error trying to update contents");
		}
		
		const note_ref = this.mustGetNote(note_id);
		note_ref.value.contents = contents;
		note_ref.value = Object.assign({}, note_ref.value);
	}

	// Threads..
	async getThreads() {
		const resp = await fetch('/api/threads/'+this.context_id.value);
		if( !resp.ok ) throw new Error("fetch not OK");
		const data = <any[]>await resp.json();
		const temp_threads :Map<number,Thread> = new Map;
		data.forEach( raw => {
			const id = parseInt(raw.thread);
			temp_threads.set(id, {
				id,
				contents: raw.contents+'',
				created: new Date(raw.created),
				parent: raw.parent,
				children: []
			});
		});

		temp_threads.forEach( t => {
			if(!t.parent) return;
			const p = temp_threads.get(t.parent);
			p?.children.push(t);
		});

		console.log(temp_threads)

		this.threads.value = temp_threads;
	}

	getThread(id:number) :Thread|undefined {
		return this.threads.value.get( id );
	}
	mustGetThread(id:number) :Thread {
		const t = this.getThread(id);
		if( !t ) throw new Error("could not find thread "+id);
		return t;
	}
}

function relationFromRaw(r:any) :Relation {
	return {
		created: new Date(r.created),
		label: r.label + '',
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

function addRelation( n:Ref<Note>, r:Relation) {
	const existingI = n.value.relations.findIndex( (existing) => relationEqual(existing, r) );
	if( existingI !== -1 ) {
		const existing = n.value.relations[existingI];
		if( existing.created.getTime() !== r.created.getTime() ) {
			// updated
			n.value.relations[existingI] = r;
			n.value = Object.assign({}, n.value);
		}
	}
	else {
		n.value.relations.push(r);
		n.value = Object.assign({}, n.value);
	}
}

// ont he backend the unique constriaint is: 
// UNIQUE(source, target, label) ON CONFLICT REPLACE,
// Therefore we can check for "equal" by looking at these three.
function relationEqual( a:Relation, b:Relation) :boolean {
	return a.source === b.source && a.target === b.target && a.label === b.label;
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