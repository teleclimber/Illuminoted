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

import { Context } from 'https://deno.land/x/dropserver_app@v0.2.0/mod.ts';
import {getNotesByDate, getThreads as dbGetThreads} from '../db.ts';
import type {DBNote, DBThread, DBRelation} from '../db.ts';

export async function getNotes(ctx:Context) {
	const search = ctx.url.searchParams;
	const threads_str = search.get('threads')
	if( !threads_str ) {
		ctx.respondWith(new Response("no threads specified", {status:400}));
		return;
	}
	const threads = threads_str.split(",").map( t => Number(t));
	const date_str = search.get("date");
	const date = date_str ? new Date(date_str) : new Date( Date.now().valueOf() + 1000000000 );
	let dir = "backwards"; // default for now
	let limit = 100;	// for now.

	let ret:{notes:DBNote[], relations: DBRelation[]};
	try {
		ret = await getNotesByDate({threads, from: date, backwards: true, limit});
	} catch(e) {
		ctx.respondWith(new Response(e, {status:500}));
		throw e;
	}

	ctx.respondWith(Response.json(ret));
}

export async function getThreads(ctx:Context) {
	if( ctx.params.root === undefined ) throw new Error("no root parameter");
	const root = parseInt(ctx.params.root+'');
	let ret :DBThread[];
	try {
		ret = await dbGetThreads({root})
	} catch(e) {
		ctx.respondWith(new Response(e, {status:500}));
		throw e;
	}

	ctx.respondWith(Response.json(ret));
}