import {computed, ref, shallowRef} from 'vue';
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

interface FetchedNotes {
	notes: NoteData[],
	relations: Relation[]
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
	filter_thread = ref(1);

	// Need to stash threads and notes
	threads :Ref<Map<number,Thread>> = shallowRef(new Map); 
	notes :Ref<Map<number,Note>> = shallowRef(new Map);

	context_thread = computed( () => {
		return this.getThread(this.context_id.value);
	});

	setContext(id:number) {
		this.context_id.value = id;
		this.threads.value = new Map;
		this.getThreads();
	}
	setFilterThread(id:number) {
		this.filter_thread.value = id;
		this.notes.value = new Map;
		this.getMoreNotes();
	}

	async getMoreNotes() {
		const resp = await fetch('/api/notes/'+this.filter_thread.value+'?'
			+ new URLSearchParams({
				date: this.sorted_notes.value.length === 0 ? '' : this.sorted_notes.value[0].created.toISOString()
			}));
		if( !resp.ok ) throw new Error("fetch not OK");
		const data = <{relations: any[], notes: any[]}>await resp.json();
		if( !Array.isArray(data.relations) ) throw new Error("expected an array of relations");
		const relations = data.relations.map( (r:any) => relationFromRaw(r) );
		if( !Array.isArray(data.notes) ) throw new Error("expected array of notes");
		const new_note_datas = data.notes.map( (n:any) => noteFromRaw(n) );
	
		const temp_notes = new Map(this.notes.value);
		new_note_datas.forEach( n => {
			const n2 = <Note>n;
			n2.relations = [];
			temp_notes.set(n.id, n2);
		});
		relations.forEach( r => {
			let note = this.notes.value.get(r.source);
			if( note ) note.relations.push(r);
			note = this.notes.value.get(r.target);
			if( note ) note.relations.push(r);
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

	sorted_notes :ComputedRef<Note[]> = computed( () => {
		return Array.from(this.notes.value, ([_, t]) => t).sort( (a, b) => a.created < b.created ? -1 : 1);
	});

	getNote(id:number) :Note|undefined {
		return this.notes.value.get(id);
	}
	mustGetNote(id:number) :Note {
		const n = this.getNote(id);
		if( !n ) throw new Error("could not find note "+id);
		return n;
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
			const parent_thread = this.mustGetThread(ref_note.thread);
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

			// TODO need to push relation too
		}

		const temp_notes = new Map(this.notes.value);
		temp_notes.set(new_id, new_note);
		this.notes.value = temp_notes;

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