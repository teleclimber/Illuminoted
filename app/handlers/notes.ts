import { Context } from 'https://deno.land/x/dropserver_app@v0.2.1/mod.ts';
import {createNote, updateContents, createThread, createRelation, deleteRelation, getNoteById, rel_labels} from '../db.ts';
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
	thread_id: number|undefined,	// thread_id is not included if we are threading out
	contents: string,
	created: Date,
	rel_deltas: EditRel[]
}
type EditRel = {
	action: 'delete' | 'add',
	label: RelationLabel,
	note_id: number
}
export async function postNote(ctx:Context) {
    const json = <PostData>await ctx.request.json();

	let id : number;
	if( json.thread_id ) {
		id = createNote({contents:json.contents, thread:json.thread_id, created:json.created});
	}
	else {
		const thread_out = json.rel_deltas.find( d => d.label === 'thread-out' );
		if( !thread_out ) throw new Error("expected a thread_out relation because thread_id was not included");
		id = createThread({contents:json.contents, created:json.created, parent: thread_out.note_id});
	}

	json.rel_deltas.forEach( r => {
		validateRelationLabel(r.label);
		if(r.action === 'add') {
			createRelation({source:id, target:r.note_id, label:r.label, created:json.created});
		}
	});

	ctx.respondJson({id});
}

type PatchData = {
	note_id: number,
	contents: string,
	rel_deltas: EditRel[],
	modified: Date
}
export async function patchNote(ctx:Context) {
	const json = <PatchData>await ctx.request.json();
	// we should have a transaction here, to allow complete rollback in case of error
	const note = getNoteById(json.note_id).note;
	
	const note_time = new Date(note.created).getTime();
	json.rel_deltas.forEach( d => {
		validateRelationLabel(d.label);
		if( d.label === 'thread-out' ) throw new Error("there should not be any changes to thread-out relations");
		if( d.action === 'add' ) {
			const target = getNoteById(d.note_id).note;
			if( new Date(target.created).getTime() > note_time ) throw new Error("target note created after source");
		}
	});
	if( json.contents ) {
		updateContents(json.note_id, json.contents);
	}
	json.rel_deltas.forEach( r => {
		if(r.action === 'add') {
			createRelation({source:json.note_id, target:r.note_id, label:r.label, created:json.modified});
		}
		else if( r.action === 'delete' ) {
			deleteRelation(json.note_id, r.note_id, r.label);
		}
	});
	ctx.respondStatus(200, "OK");
}

function validateRelationLabel(label:RelationLabel) {
	if( !rel_labels.includes(label) ) throw new Error("Invalid label: "+label);
}