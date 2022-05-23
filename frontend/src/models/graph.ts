import {computed, ref} from 'vue';
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
	depth: number,
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
	thread: number,
	parent: number,
	depth: number,
	root: NoteData,
	leaf: NoteData|undefined
}

export class NotesGraph {

	context_id = ref(1);
	thread_id = ref(1);

	// Need to stash threads and notes
	threads :Ref<Thread[]> = ref([]); 
	notes :Ref<Map<number,Note>> = ref(new Map);

	setContext(id:number) {
		this.context_id.value = id;
		this.getMoreNotes();
	}
	setThread(id:number) {
		this.thread_id.value = id;
	}

	async getMoreNotes() {

		const resp = await fetch('/api/notes/'+this.context_id.value+'?'
			+ new URLSearchParams({
				date: this.sorted_notes.value.length === 0 ? '' : this.sorted_notes.value[0].created.toISOString()
			}));
		if( !resp.ok ) throw new Error("fetch not OK");
		const data = <{relations: any[], notes: any[]}>await resp.json();
		if( !Array.isArray(data.relations) ) throw new Error("expected an array of relations");
		const relations = data.relations.map( (r:any) => relationFromRaw(r) );
		if( !Array.isArray(data.notes) ) throw new Error("expected array of notes");
		const new_note_datas = data.notes.map( (n:any) => noteFromRaw(n) );
	
		new_note_datas.forEach( n => {
			const n2 = <Note>n;
			n2.relations = [];
			this.notes.value.set(n.id, n2);
		});
		relations.forEach( r => {
			let note = this.notes.value.get(r.source);
			if( note ) note.relations.push(r);
			note = this.notes.value.get(r.target);
			if( note ) note.relations.push(r);
		});


	
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

	async getThreads() {
		const resp = await fetch('/api/threads/'+this.context_id.value);
		if( !resp.ok ) throw new Error("fetch not OK");
		const data = <any[]>await resp.json();
		this.threads.value = data.map( raw => {
			return {
				thread: parseInt(raw.thread),
				parent: parseInt(raw.parent),
				depth: parseInt(raw.depth),
				root: noteFromRaw(raw.root),
				leaf: raw.leaf ? noteFromRaw(raw.leaf) : undefined
			}
		});
	}

	getThread(id:number) :Thread|undefined {
		return this.threads.value.find( t => t.thread == id );
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
		depth: parseInt(n.depth),
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