// Graph-like queries for getting notes
// Examples of queries:

// When starting the app you want the most recent notes on the threads of interest
// (assumes some threads are marked as "currently of interest")
// Maybe you have to start with a note id that is the root of the project
// .. and go all the way down to find the leaf nodes, 
// and select back from these in a given time range or number of notes
// Yikes! that's a scary query.

// Start with basics:
// For a given note, go back n notes of "follows"

// WITH RECURSIVE traverse(id) AS (
// 	SELECT 6963
// 	UNION ALL
// 	SELECT target FROM relations JOIN traverse ON source = id LIMIT 10
// )  SELECT traverse.id, notes.created, notes.contents FROM traverse LEFT JOIN notes ON traverse.id = notes.id;


// create handler that gets and returns notes and relations for a... time period?

import { Context } from 'https://deno.land/x/dropserver_app@v0.1.1/approutes.ts';
import {getNotesByDate, getThreads as dbGetThreads} from '../db.ts';
import type {DBNote, DBRelation} from '../db.ts';

export async function getLatestNotes(ctx:Context) {
	const thread = ctx.params.thread ? parseInt(ctx.params.thread+'') : 1;
	let ret:{notes:DBNote[], relations: DBRelation[]};
	try {
		ret = await getNotesByDate({thread, from: new Date, backwards: true, limit: 50});
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

export async function getThreads(ctx:Context) {
	if( ctx.params.root === undefined ) throw new Error("no root parameter");
	const root = parseInt(ctx.params.root+'');
	let ret :{root: DBNote,leaf: DBNote}[];
	try {
		ret = await dbGetThreads({root})
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