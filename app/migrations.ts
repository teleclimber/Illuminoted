import {MigrationsBuilder} from './deps.ts';

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

	return m.migrations;
}