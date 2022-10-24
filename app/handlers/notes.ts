import { Context } from 'https://deno.land/x/dropserver_app@v0.2.1/mod.ts';
import {createNote, updateContents, createThread, createRelation, getNoteById} from '../db.ts';
import type {DBNote, DBRelation} from '../db.ts';

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
	ref_note_id: number,
	relation: "follows"|"thread-out",
	contents: string,
	created: Date,
	targets: {target: number, label: string}[]
}
export async function postNote(ctx:Context) {
	// contents, created,
	// and the edges that are created at the same time (like "follows"/"next", "side", "merge")
	// creates an id and returns it probably

    const json = <PostData>await ctx.request.json();

	// check contents make sense.

	// create note
	// then add edges.
	// should take place as a transction ideally
	let id : number;
	if( json.relation === "follows" ) {
		id = createNote({contents:json.contents, thread:json.ref_note_id, created:json.created});
	}
	else if( json.relation === "thread-out" ) {
		id = createThread({contents:json.contents, created:json.created, parent: json.ref_note_id});
		// Here we'd like to return the thread data, which should include depth.
		// However we don't necessarily have the context, so, where do you start the tree?
		// Plus I don't even know if we can select just one thread? Or is our query going to return all threads? Not great.
	}
	else throw new Error("what is this relation? "+json.relation);

	json.targets.forEach( t => {
		createRelation({source:id, target:t.target, label:t.label, created:json.created});
	});

	ctx.respondJson({id});
}

type PatchData = {
	note_id: number,
	contents?: string,
}
export async function patchNote(ctx:Context) {
	const json = <PatchData>await ctx.request.json();
	if( json.contents ) {
		updateContents(json.note_id, json.contents);
	}
	ctx.respondStatus(200, "OK");
}