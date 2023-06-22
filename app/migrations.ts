import {MigrationsBuilder} from 'https://deno.land/x/dropserver_app@v0.2.1/mod.ts';

import {getDB, getCreateDB, getDBFile} from './db.ts';

export default function createMigrations() {
	const m = new MigrationsBuilder;

	console.log("Illuminoted registering migrations");
	m.upTo(1, async () => {
		console.log("creating db");
		const db = getCreateDB();
	
		console.log("creating tables");
		db.query(`CREATE TABLE "notes" (
				"id" INTEGER PRIMARY KEY ASC,
				"thread" INTEGER NOT NULL,
				"contents" TEXT,
				"created" DATETIME
			)`);
		db.query(`CREATE INDEX notes_thread ON notes (thread)`);
		db.query(`CREATE INDEX notes_created ON notes (created)`);

		// maybe create the first node as a root node?
		db.query('INSERT INTO notes ("thread", "contents", "created") VALUES (1, :contents, :created)', {contents:"Root node", created:new Date});

		db.query(`CREATE TABLE "relations" (
			"source" INTEGER,
			"target" INTEGER,
			"label" TEXT,
			"created" DATETIME,
			UNIQUE(source, target, label) ON CONFLICT REPLACE,
			FOREIGN KEY(source) REFERENCES notes(id),
			FOREIGN KEY(target) REFERENCES notes(id)
		)`);
		db.query(`CREATE INDEX relations_source ON relations(source)`);
		db.query(`CREATE INDEX relations_target ON relations(target)`);
	
		db.close();
	});

	m.downFrom(1, async() => {
		const db = getDB();
		db.close();//just to be sure.

		const filename = getDBFile();
		await Deno.remove(filename);
	});

	m.upTo(2, async () => {
		// - create threads table
		// - read current set of threads
		// - create rows in thread table, keep new id <-> old thread id ref
		// - update thread id in notes
		//await Deno.readFile("");
		// - change all "thread-out" relations to "see also"? or "in reply to"?
		const db = getDB();
		db.query(`CREATE TABLE "threads" (
			"id" INTEGER PRIMARY KEY ASC,
			"parent_id" INTEGER,
			"name" TEXT,
			"created" DATETIME
		)`);	// Later we can add additional data if desired.
		db.query(`CREATE INDEX thread_parent ON threads (parent_id)`);

		const threads = getThreads1({root:1});
		threads.forEach( t => {
			db.query('INSERT INTO threads ("name", "created") VALUES (:name, :created)', 
				{name: t.contents, created: t.created});
			t.new_thread = db.lastInsertRowId;
		});
		threads.filter(t => !!t.parent ).forEach( t => {
			if( t.new_thread === undefined ) throw new Error("got undefined new thread, "+ t);
			const new_parent = threads.find( f => f.old_thread === t.parent );
			if( new_parent === undefined ) throw new Error("can't find new parent thread?!?");
			db.query('UPDATE threads SET parent_id = :parent_id WHERE id = :id', {parent_id: new_parent.new_thread, id: t.new_thread});
		});
		console.log("getting notes");
		const notes = db.queryEntries<{id:number, thread:number}>('SELECT id, thread FROM notes');
		db.transaction( () => {
			const q = db.prepareQuery('UPDATE notes SET thread = :thread WHERE id = :id');
			console.log("updating thread on notes "+notes.length);
			notes.forEach( n => {
				const t = threads.find( t => t.old_thread === n.thread );
				if( t === undefined ) throw new Error("thread not found! " + n);
				q.execute({thread: t.new_thread, id: n.id});
			});
		});

		// add index on notes to improve select performance of notes:
		db.query(`CREATE INDEX notes_thread_created ON notes (thread, created)`);

	});
	// Make a down-migration:
	// - continue to use thread out? or some other relation like note-from-parent-thread -> thread 
	// Then you can rebuild the thread-out relations 
	m.downFrom(2, async () => {
		// TODO 
		// For every thread-out relation
		// - the load the note at rel's target, and read its thread
		// - in obj of v2_thread -> v1_thread, v2_thread is thread id from threads table, v1 is the trget note.
		// After that, find any note for which you don't have a thread and reconstitute.
		// Use the first note in the thread, and nearest previous note in parent thread to generate a thread-out relation.
	});

	return m.migrations;
}

type DBThread = {
	old_thread: number,
	new_thread: number|undefined,
	parent: number,
	contents: string,
	created: Date
}

function getThreads1(params :{root:number}) :DBThread[] {
	const db = getDB();
	const sel = `WITH RECURSIVE 
	desc_threads(thread, parent, depth) AS (
		SELECT :root, NULL, 0 
		UNION ALL
		SELECT  relations.source, desc_threads.thread, depth +1 
			FROM desc_threads
			JOIN notes ON desc_threads.thread = notes.thread
			JOIN relations ON notes.id = relations.target
			WHERE relations.label = 'thread-out'
			)
	SELECT desc_threads.thread, desc_threads.parent, desc_threads.depth,
	root.contents, root.created 
	FROM desc_threads
	JOIN notes AS root ON root.id = desc_threads.thread`

	const thread_notes = <any> db.queryEntries( sel, params );
	
	const ret :DBThread[] = thread_notes.map( (tn:any) => {
		const ret :DBThread = {
			old_thread: tn.thread,
			new_thread: undefined,
			parent: tn.parent,
			contents: tn.contents,
			created: tn.created
		}
		return ret;
	});

	return ret;
}