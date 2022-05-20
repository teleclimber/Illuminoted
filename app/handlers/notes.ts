import type {ServerRequest, Response, Context} from "../deps.ts";
import {createNote, createRelation} from '../db.ts';

import {readAll} from 'https://deno.land/std@0.138.0/streams/conversion.ts';

// is this really interesting?
// Dealing with individual notes?

// I suppose we need post and patch
// But getters are uninteresting, perhaps.

const decoder = new TextDecoder();

export function getNote(ctx:Context) {
	const req = ctx.req;
}

type PostData = {
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
	const id = createNote({contents:json.contents, created:json.created});

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