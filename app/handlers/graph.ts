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

import { Context } from 'https://deno.land/x/dropserver_app@v0.2.1/mod.ts';
import {getNotesByDate, getNotesByDateSplit, getThreadSubtree, getDescThreadsLastActive, getThreadChildrenLastActive, updateThread} from '../db.ts';
import type {DBNote, DBThread, DBRelation} from '../db.ts';

export async function getNotes(ctx:Context) {
	const params = ctx.url.searchParams;
	const threads_str = params.get('threads')
	if( !threads_str ) {
		ctx.respondStatus(400, "no threads specified");
		return;
	}
	let threads = undefined;
	if( threads_str !== "all" ) threads = threads_str.split(",").map( t => Number(t));
	const date_str = params.get("date");
	const date = date_str ? new Date(date_str) : new Date( Date.now().valueOf() + 1000000000 );
	let dir = params.get("direction") || "before";
	if( !["before", "after", "split"].includes(dir) ) {
		ctx.respondStatus(400, "no direction, or incorrect direction specified: "+dir);
		return;
	}
	let limit = 100;	// for now.
	const search = params.get("search") || '';

	let ret:{notes:DBNote[], relations: DBRelation[]};
	try {
		if( dir === "split" ) ret = await getNotesByDateSplit({threads, from:date, limit, search});
		else ret = await getNotesByDate({threads, from: date, backwards: dir === "before", limit, search});
	} catch(e) {
		ctx.respondStatus(500, e);
		throw e;
	}

	ctx.respondJson(ret);
}

export async function getThreads(ctx:Context) {
	if( ctx.params.id === undefined ) throw new Error("no root parameter");
	const root = parseInt(ctx.params.id+'');
	const search = ctx.url.searchParams;
	const deep = search.has("deep");
	const limit = Number(search.get("limit"));
	const threads_str = search.get("threads");
	const threads :number[] = threads_str ? threads_str.split(",").map( t => Number(t)) : [];
	
	let ret :DBThread[];
	if( threads.length ) {
		ret = getThreadSubtree(root, threads);
	}
	else if( deep ) {
		const thread_actives = getDescThreadsLastActive(root, limit);
		ret = getThreadSubtree(root, thread_actives.map( a => a.thread));
	}
	else {
		const thread_actives = getThreadChildrenLastActive(root, limit);
		ret = getThreadSubtree(root, thread_actives.map( a => a.thread));	// why do you need the subtree?
	}

	ctx.respondWith(Response.json(ret));
}

type PatchThreadData = {
	parent_id: number,
	name: string
}
export async function patchThread(ctx:Context) {
	if( ctx.params.id === undefined ) throw new Error("no thread id parameter");
	const thread_id = parseInt(ctx.params.id+'');
	const json = <PatchThreadData>await ctx.request.json();

	updateThread(thread_id, json.parent_id, json.name);
	
	ctx.respondStatus(200, "OK");
}