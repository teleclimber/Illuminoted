import {RoutesBuilder, AuthAllow} from './deps.ts';

import {getNote, postNote, patchNote} from './handlers/notes.ts';
import {getNotes, getThreads} from './handlers/graph.ts';
import {getCurrentUser} from './handlers/user.ts';

export default function createRoutes() {
	const r = new RoutesBuilder;

	const publicRoute = {allow:AuthAllow.public};
	const authorizedOnly = {allow:AuthAllow.authorized};

	// notes items CRUD:
	r.add("get", "/api/notes/", authorizedOnly, getNotes);	// oh god. That's not right
	r.add("get", "/api/notes/:id", authorizedOnly, getNote);
	r.add("post", "/api/notes", authorizedOnly, postNote);
	//r.add("patch", "/api/notes/:id", authorizedOnly, patchNote);

	r.add("get", "/api/threads/:root", authorizedOnly, getThreads);
	

	// Need some graph retrieval capabilities!

	// users:
	r.add("get", "/api/current-user", authorizedOnly, getCurrentUser)

	// user avatars...
	r.add("get", {path:"/avatars", end: false}, authorizedOnly, r.staticFileHandler({path:'@avatars/'}));

	// frontend. if bare path then serve index
	r.add("get", "/", authorizedOnly, r.staticFileHandler({path:'@app/frontend/index.html'}));
	// serve pwa icons using public routes (sadly) because credentials are not sent
	r.add("get", {path:"/img/icons/", end: false}, publicRoute, r.staticFileHandler({path:'@app/frontend/img/icons/'}));
	// serve static frontend assets:
	r.add("get", {path:"/", end:false}, authorizedOnly, r.staticFileHandler({path:'@app/frontend/'}));
	// !! We'll need a way to send index.hml if no file found.

	return r.routes;
}