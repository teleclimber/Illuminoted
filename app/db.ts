import app from './app.ts';
import { DB } from "https://deno.land/x/sqlite@v3.4.0/mod.ts";

const dbFilename = "notes.db";
let db :DB|undefined;

export function getDB() :DB {
	if( db === undefined ) {
		const start = Date.now();
		db = new DB(app.appspacePath(dbFilename), {mode:"write"});
		console.log(`getDB: ${Date.now() - start}`);
	}
	return db;
}

export function getCreateDB() :DB {
	if( db === undefined ) db = new DB(app.appspacePath(dbFilename), {mode:"create"});
	return db;
}

export function getDBFile() :string {
	return app.appspacePath(dbFilename);
}

// These should take a transaction or a db
// or somehow support transactional querying across multipole functions
export function createNote(note :{contents :string, created :Date}) :number {
	const db = getDB();
	db.query('INSERT INTO notes ("contents", "created") VALUES (:contents, :created)', note);
	return db.lastInsertRowId;
}

export function createRelation(relation:{source :number, target :number, label: string, created :Date} ) {
	getDB().query('INSERT INTO relations ("source", "target", "label", "created") '
		+' VALUES(:source, :target, :label, :created)', relation);
}

// Graph gets:

// variations of note-only getters: (ie getters where we don't traverse at the graph)
// vector 1: created date:
// - date range
// - date, direction, and limit (after Nov 1 limit 100)
// - date range and limit (almost like paging)
// vector 2: content:
// - Like queries

// returned data variations:
// - include relations or not?

export type DBNote = {
	id: number,
	thread: number,
	depth: number,
	created: Date,
	contents: string
}

export type DBRelation = {
	source: number,
	target: number,
	label: string,
	created: Date
}

// const sql_notes_date_backwards = `SELECT id, thread, created, contents FROM notes JOIN note_thread ON id = note 
// 									WHERE created <= :from ORDER BY created DESC LIMIT :limit`
// const sql_notes_date_forwards  = `SELECT id, thread, created, contents FROM notes JOIN note_thread ON id = note
// 									WHERE created >= :from ORDER BY created ASC  LIMIT :limit`;

const sql_notes_date_base = `WITH RECURSIVE 
desc_threads(thread, parent, depth) AS (
	SELECT :thread, NULL, 0 
	UNION ALL
	SELECT  relations.source, desc_threads.thread, depth +1 
		FROM desc_threads
		JOIN note_thread ON desc_threads.thread = note_thread.thread
		JOIN relations ON note_thread.note = relations.target
		WHERE relations.label = 'thread-out'
		)
SELECT notes.id, desc_threads.thread, desc_threads.depth, created, contents FROM desc_threads 
JOIN note_thread ON desc_threads.thread = note_thread.thread
JOIN notes ON notes.id = note_thread.note `;
const sql_notes_date_backwards = sql_notes_date_base 
	+ `WHERE created <= :from ORDER BY created DESC LIMIT :limit`;
const sql_notes_date_forwards = sql_notes_date_base 
	+ `WHERE created >= :from ORDER BY created ASC  LIMIT :limit`;

// For now just force client to include both dates and a limit
// except that doesn't work because you don't know direction.
export function getNotesByDate(params :{thread: number, from:Date, backwards: boolean, limit:number}) :{notes:DBNote[], relations: any} {
	const db = getDB();
	const ret :{notes:DBNote[], relations: any} = {notes: [], relations: undefined};
	db.transaction( () => {
		const notes_select = params.backwards ? sql_notes_date_backwards : sql_notes_date_forwards;
		ret.notes = <DBNote[]> db.queryEntries( notes_select, {thread:params.thread, from:params.from, limit: params.limit} );

		const rel_select = `WITH sel_notes AS ( ${notes_select}	)
		SELECT relations.* FROM  sel_notes LEFT JOIN relations ON sel_notes.id = relations.source 
		WHERE relations.source NOT NULL
		UNION
		SELECT relations.* FROM  sel_notes LEFT JOIN relations ON sel_notes.id = relations.target
		WHERE relations.source NOT NULL`;
		ret.relations = <DBRelation[]>db.queryEntries(rel_select,  {thread:params.thread, from:params.from, limit: params.limit});
	});
	return ret;
}

/* More get:
WITH RECURSIVE 
	desc_notes(id, thread, label) AS (
		SELECT 1, 1, ""
		UNION ALL
		SELECT relations.source, 
			CASE WHEN relations.label == "thread-out" THEN relations.source ELSE thread END AS thread,
			relations.label 
		FROM relations
		JOIN desc_notes ON relations.target = id
		WHERE relations.label = "follows" OR relations.label = "thread-out"
	)
SELECT desc_notes.id, desc_notes.thread, contents, created FROM desc_notes JOIN notes ON notes.id = desc_notes.id
	ORDER BY created DESC LIMIT 100;
*/

/*
-- Can we build an "index" of note -> thread?
WITH RECURSIVE 
	desc_notes(id, thread) AS (
		SELECT 1, 1
		UNION ALL
		SELECT relations.source, 
			CASE WHEN relations.label == "thread-out" THEN relations.source ELSE thread END AS thread
		FROM relations
		JOIN desc_notes ON relations.target = id
		WHERE relations.label = "follows" OR relations.label = "thread-out"
	)
SELECT * FROM desc_notes ;
*/

/*

-- Can we build a map of threads? thread -> parent
WITH RECURSIVE 
	desc_notes(id, thread, parent) AS (
		SELECT 1, 1, NULL
		UNION ALL
		SELECT relations.source, 
			CASE WHEN relations.label == "thread-out" THEN relations.source ELSE thread END AS thread,
			CASE WHEN relations.label == "thread-out" THEN thread ELSE NULL END AS parent
		FROM relations
		JOIN desc_notes ON relations.target = id
		WHERE relations.label = "follows" OR relations.label = "thread-out"
	)
SELECT thread, parent FROM desc_notes WHERE parent IS NOT NULL;

*/
// Graph traversal query variations...
// From a given root node, find all threads (nodes that are related via "thread-out")
// Then: from a given root node find all descending notes that have no "follows" relation (open threads)
// .. but you don't want just the last one, you want the last few?

// Steps:
// Find threads
// Find last n notes of each thread

// Assign threadd id to notes:

// WITH RECURSIVE desc_notes(id, thread, label) AS (
// 	SELECT 1, 1, ""
// 	UNION 
// 	SELECT source, 
// 		CASE WHEN relations.label == "thread-out" THEN source ELSE thread END AS thread,
// 	relations.label FROM relations JOIN desc_notes ON target = id
// )
// SELECT * FROM desc_notes JOIN notes ON notes.id = desc_notes.id ;

// Get threads with root and leaf notes
// WITH RECURSIVE 
// 	desc_notes(id, thread, is_leaf, label) AS (
// 		SELECT 1, 1, FALSE, ""
// 		UNION 
// 		SELECT relations.source, 
// 			CASE WHEN relations.label == "thread-out" THEN relations.source ELSE thread END AS thread,
// 			CASE WHEN follower.source IS NULL THEN TRUE ELSE FALSE END AS is_leaf,
// 			relations.label 
// 		FROM relations
// 		JOIN desc_notes ON relations.target = id
// 		LEFT OUTER JOIN relations AS follower ON relations.source = follower.target
// 		WHERE relations.label = "follows" OR relations.label = "thread-out"
// 	)
// SELECT * FROM desc_notes JOIN notes ON notes.id = desc_notes.id
// 	WHERE label = "thread-out" OR is_leaf = TRUE;


/* 
-- Get threads, returns both root and laf notes in a single row
-- Does not return thread id 1
-- Also does not have a starting point, so returns every thread in the DB
SELECT relations.target AS parent,
	root_note.id AS root_id, root_note.created AS root_created, root_note.contents AS root_contents,
	leaf_note.id AS leaf_id, leaf_note.created AS leaf_created, leaf_note.contents AS leaf_contents
FROM relations 
JOIN note_thread ON note_thread.thread = relations.source
LEFT OUTER JOIN relations AS follower ON note_thread.note = follower.target
JOIN notes as root_note ON relations.source = root_note.id
JOIN notes AS leaf_note ON note_thread.note = leaf_note.id
WHERE relations.label = 'thread-out'
AND follower.label IS NULL

*/

export type DBThread = {
	thread: number,
	parent: number,
	depth: number,
	root: DBNote,
	leaf: DBNote
}

export function getThreads(params :{root:number}) :DBThread[] {
	const db = getDB();
	const sel = `WITH RECURSIVE 
			desc_notes(id, thread, parent, depth, is_leaf, label) AS (
				SELECT :root, :root, NULL, 0, FALSE, 'thread-out'
				UNION 
				SELECT relations.source, 
					CASE WHEN relations.label == 'thread-out' THEN relations.source ELSE thread END AS thread,
					CASE WHEN relations.label == 'thread-out' THEN thread ELSE NULL END AS parent,
					CASE WHEN relations.label == 'thread-out' THEN depth+1 ELSE depth END AS depth,
					CASE WHEN follower.source IS NULL THEN TRUE ELSE FALSE END AS is_leaf,
					relations.label 
				FROM relations
				JOIN desc_notes ON relations.target = id
				LEFT OUTER JOIN relations AS follower ON relations.source = follower.target
				WHERE relations.label = 'follows' OR relations.label = 'thread-out'
			)
		SELECT desc_notes.id, desc_notes.thread, desc_notes.parent, desc_notes.depth, is_leaf, contents, created FROM desc_notes JOIN notes ON notes.id = desc_notes.id
			WHERE label = 'thread-out' OR is_leaf = TRUE;`;
	const thread_notes = <any> db.queryEntries( sel, params );
	
	const ret :DBThread[] = [];
	thread_notes.forEach( (tn:any) => {
		const thread_id = tn.thread;
		let found = ret.find( r => r.thread == thread_id);
		
		if( !found ) {
			//@ts-ignore
			found = {
				thread: thread_id,
				parent: tn.parent,
				depth: tn.depth
			};
			//@ts-ignore
			ret.push(found);
		}
		const note:DBNote = {
			id: tn.id,
			thread: tn.thread,
			depth: tn.depth,
			contents: tn.contents,
			created: tn.created
		};
		if( tn.is_leaf ) found!.leaf = note;
		else found!.root = note;
	});

	return ret;
}