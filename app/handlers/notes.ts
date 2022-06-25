import type {ServerRequest, Response, Context} from "../deps.ts";
import {createNote, createThread, createRelation, getNoteById} from '../db.ts';
import type {DBNote, DBRelation} from '../db.ts';

import {readAll} from 'https://deno.land/std@0.138.0/streams/conversion.ts';

// is this really interesting?
// Dealing with individual notes?

// I suppose we need post and patch
// But getters are uninteresting, perhaps.

const decoder = new TextDecoder();

export async function getNote(ctx:Context) {
	const id = parseInt(ctx.params.id+'', 10);

	let ret:{note:DBNote, relations: DBRelation[]};
	try {
		ret = await getNoteById(id);
	} catch(e) {
		ctx.req.respond({status:500, body:e});
		throw e;
	}

	const headers = new Headers;
	headers.set('Content-Type', 'application/json');
	ctx.req.respond({
		status: 200,
		headers: headers,
		body: JSON.stringify(ret)
	});
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

	const req = ctx.req;
	req.body
	const buf = await readAll(req.body);
    const json = <PostData>JSON.parse(decoder.decode(buf));

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

	// const headers = new Headers;
	// headers.set('Content-Type', 'application/json');
	// const json_resp =  JSON.stringify({id});
	// const arr_resp = new TextEncoder().encode(json_resp);
	// const resp = new Response(JSON.stringify({id}), {status:200, headers} )
	// ctx.req.respond(resp);

	const headers = new Headers;
	headers.set('Content-Type', 'application/json');
	const resp: Response = {
		status: 200,
		headers: headers,
		body: JSON.stringify({id})
	};
	ctx.req.respond(resp);
}

export function patchNote(ctx:Context) {
	// contents, [edit datetime]
	// assume edits to edges are done in a separate set of handlers?
	// or maybe this set of handlers should be called mutators or something.
}