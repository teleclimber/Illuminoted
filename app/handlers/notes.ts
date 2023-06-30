import { Context } from 'https://deno.land/x/dropserver_app@v0.2.1/mod.ts';
import {createNote, updateNoteContents, createThread, createRelation, deleteRelation, getNoteById, rel_labels, updateNoteThread} from '../db.ts';
import type {DBNote, DBRelation, RelationLabel} from '../db.ts';

// is this really interesting?
// Dealing with individual notes?

// I suppose we need post and patch
// But getters are uninteresting, perhaps.

export async function getNote(ctx:Context) {
	const id = parseInt(ctx.params.id+'', 10);

	let ret:{note:DBNote, relations: DBRelation[]};
	try {
		ret = await getNoteById(id);
	} catch(e) {
		ctx.respondWith(new Response(e, {status:500}));
		throw e;
	}
	ctx.respondJson(ret);
}

type PostData = {
	thread_id: number,	// thread of note or parent of new thread
	contents: string,
	created: Date,
	rel_deltas: EditRel[],
	new_thread_name: string|undefined	// creates a new thread under thread_id
}
type EditRel = {
	action: 'delete' | 'add',
	label: RelationLabel,
	note_id: number
}
export async function postNote(ctx:Context) {
    const json = <PostData>await ctx.request.json();

	let note_id : number;
	let thread_id = json.thread_id;
	if( json.new_thread_name ) {
		thread_id = createThread({parent_id: thread_id, name: json.new_thread_name, created: json.created});
	}
	
	note_id = createNote({contents:json.contents, thread:thread_id, created:json.created});
	
	json.rel_deltas.forEach( r => {
		validateRelationLabel(r.label);
		if(r.action === 'add') {
			createRelation({source:note_id, target:r.note_id, label:r.label, created:json.created});
		}
	});

	ctx.respondJson({note_id, thread_id});
}

type PatchData = {
	note_id: number,
	contents: string,
	rel_deltas: EditRel[],
	modified: Date,
	thread_id: number,
	new_thread_name: string|undefined	// creates a new thread under thread_id
}
export async function patchNote(ctx:Context) {
	const json = <PatchData>await ctx.request.json();
	// we should have a transaction here, to allow complete rollback in case of error
	const note = getNoteById(json.note_id).note;

	const note_time = new Date(note.created).getTime();
	json.rel_deltas.forEach( d => {
		validateRelationLabel(d.label);
		if( d.action === 'add' ) {
			const target = getNoteById(d.note_id).note;
			if( new Date(target.created).getTime() > note_time ) throw new Error("target note created after source");
		}
	});

	let thread_id = json.thread_id;
	if( json.new_thread_name ) {
		thread_id = createThread({parent_id: json.thread_id, name: json.new_thread_name, created: json.modified});
	}

	if( json.contents ) {
		updateNoteContents(json.note_id, json.contents);
	}
	if( thread_id !== note.thread ) {
		updateNoteThread(json.note_id, thread_id);
	}
	json.rel_deltas.forEach( r => {
		if(r.action === 'add') {
			createRelation({source:json.note_id, target:r.note_id, label:r.label, created:json.modified});
		}
		else if( r.action === 'delete' ) {
			deleteRelation(json.note_id, r.note_id, r.label);
		}
	});

	ctx.respondJson({thread_id});
}

function validateRelationLabel(label:RelationLabel) {
	if( !rel_labels.includes(label) ) throw new Error("Invalid label: "+label);
}