import app from './app.ts';
import { DB } from "https://deno.land/x/sqlite@v3.7.2/mod.ts";

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

export type RelationLabel = 'thread-out' | 'in-reply-to' | 'see-also';
export const rel_labels :RelationLabel[] = ['thread-out', 'in-reply-to', 'see-also'];


// These should take a transaction or a db
// or somehow support transactional querying across multipole functions
export function createNote(note :{contents :string, thread :number, created :Date}) :number {
	const db = getDB();
	db.query('INSERT INTO notes ("contents", "thread", "created") VALUES (:contents, :thread, :created)', note);
	return db.lastInsertRowId;
}

export function updateContents( note_id:number, contents:string) {
	const db = getDB();
	db.query('UPDATE notes SET contents = :contents WHERE id = :note_id', {contents, note_id});
}

export function createThread(note :{contents :string, created :Date, parent :number}) :number {
	const db = getDB();
	let id :number = 0;
	db.transaction( () => {
		db.query('INSERT INTO notes ("contents", "thread", "created") VALUES (:contents, :thread, :created)', 
			{contents: note.contents, thread: 1, created: note.created});
		id = db.lastInsertRowId;
		// set the thread to note's own id:
		db.query('UPDATE notes SET thread = :id WHERE id = :id', {id});
		// create the relation
		createRelation({source:id, target:note.parent, label:"thread-out", created: note.created});
	});

	return id;
}

export function createRelation(relation:{source :number, target :number, label: string, created :Date} ) {
	getDB().query('INSERT INTO relations ("source", "target", "label", "created") '
		+' VALUES(:source, :target, :label, :created)', relation);
}

export function deleteRelation(source:number, target:number, label: string) {
	getDB().query('DELETE FROM relations WHERE '
		+' source = :source, target = :target, label = :label',
		{source, target, label});
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
	created: Date,
	contents: string
}

export type DBRelation = {
	source: number,
	target: number,
	label: string,
	created: Date
}

export function getNotesByDate(params :{threads: number[], from:Date, backwards: boolean, limit:number, search?:string}) :{notes:DBNote[], relations: DBRelation[]} {
	const db = getDB();
	const ret :{notes:DBNote[], relations: DBRelation[]} = {notes: [], relations: []};
	db.transaction( () => {
		const args :{from:Date, limit:number, search?:string} = {from:params.from, limit:params.limit};
		let notes_select = `SELECT notes.id, notes.thread, notes.created, notes.contents FROM notes `
			+ `WHERE notes.thread IN (`+params.threads.join(",")+') ';
		if( params.search ) {
			args.search = '%'+params.search+'%'
			notes_select += 'AND notes.contents LIKE :search '
		}		
		notes_select += 'AND created '
			+  (params.backwards ? `<= :from ORDER BY created DESC` : `>= :from ORDER BY created ASC`);
		notes_select += ' LIMIT :limit';
		ret.notes = <DBNote[]> db.queryEntries( notes_select, args );

		const rel_select = `WITH sel_notes AS ( ${notes_select}	)
		SELECT relations.* FROM  sel_notes LEFT JOIN relations ON sel_notes.id = relations.source 
		WHERE relations.source NOT NULL
		UNION
		SELECT relations.* FROM  sel_notes LEFT JOIN relations ON sel_notes.id = relations.target
		WHERE relations.source NOT NULL`;
		ret.relations = <DBRelation[]>db.queryEntries(rel_select,  {from:params.from, limit: params.limit});
	});
	return ret;
}

export function getNoteById(id:number) :{note:DBNote, relations: DBRelation[]} {
	const db = getDB();
	let note :DBNote|undefined;
	let relations :DBRelation[] = [];
	db.transaction( () => {
		const notes = db.queryEntries<DBNote>('SELECT id, thread, contents, created FROM notes WHERE id = :id', {id});
		if( notes.length === 0 ) throw new Error("note id not found: "+id);
		note = notes[0];
		relations = db.queryEntries<DBRelation>('SELECT * FROM relations WHERE source = :id OR target = :id', {id});
	});
	if( note === undefined ) throw new Error("no note returned");
	return {
		note,
		relations
	};
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
	id: number,
	name: string,
	parent_id: number | null,
	created: Date,
	num_children: number
}

// get descendants of thread, by deep-last-active
export function getDescThreadsLastActive(root: number, limit: number) :{thread: number, last:Date}[] {
	const db = getDB();
	const q = db.prepareQuery<never,{thread: number, last:Date}, {root:number, limit: number}>(`
	WITH RECURSIVE 
	desc_threads(id) AS (
		SELECT :root 
		UNION ALL
		SELECT threads.id
			FROM desc_threads
			JOIN threads ON desc_threads.id = threads.parent_id
		)
	SELECT notes.thread, max(created) AS "last" 
		FROM desc_threads 
		JOIN notes ON notes.thread = desc_threads.id
		GROUP BY notes.thread ORDER BY max(created) DESC LIMIT :limit`);
	const rows = q.allEntries({root, limit});
	q.finalize();
	return rows;
}

// get children of thread, by deep-last-active
export function getThreadChildrenLastActive(root: number, limit: number) :{thread: number, last:Date}[] {
	const db = getDB();
	const q = db.prepareQuery<never,{thread: number, last:Date}, {root:number, limit:number}>(`
	WITH RECURSIVE 
	desc_threads(id) AS (
		SELECT :root
		UNION ALL
		SELECT threads.id
			FROM desc_threads
			JOIN threads ON desc_threads.id = threads.parent_id
		)
	SELECT notes.thread, max(notes.created) AS "last" 
		FROM desc_threads 
		JOIN notes ON notes.thread = desc_threads.id
		JOIN threads ON desc_threads.id = threads.id
		WHERE threads.parent_id = :root
		GROUP BY notes.thread ORDER BY max(notes.created) DESC LIMIT :limit`);
	const rows = q.allEntries({root, limit});
	q.finalize();
	return rows;
}

// getThreadSubtree returns all threads necessary to display 
// the tree of threads from root to each leaf
export function getThreadSubtree(root: number, leaves: number[]) :DBThread[] {
	const threads :DBThread[] = [...leaves, root].map( l => {
		return {
			id: l,
			parent_id: null,
			name: "",
			created: new Date,
			num_children: 0
		}
	});

	for( let i=0; i< threads.length; ++i) {
		const thread = threads[i];
		if( !thread.parent_id ) {
			// load it
			const thread_data = getThread(thread.id)
			Object.assign(thread, thread_data);
			if( thread.parent_id && thread.parent_id !== root && !threads.find(t => t.id === thread.parent_id) ) {
				threads.push({
					id: thread.parent_id,
					parent_id: null,
					name: "",
					created: new Date,
					num_children: 0
				});
			}
		}
	}

	return threads;
}

function getThread(id: number) :DBThread {
	const db = getDB();
	const q = db.prepareQuery<never,DBThread,{id:number}>(`
		SELECT threads.id, threads.name, threads.parent_id, threads.created,
		(SELECT count(*) FROM threads WHERE threads.parent_id = :id) AS num_children
		FROM threads WHERE threads.id = :id
	`);
	const row = q.firstEntry({id});
	if( !row ) throw new Error("missing thread: "+id);
	q.finalize();
	return row;
}
