import type {Context, Response} from '../deps.ts';
import app from '../app.ts';

export async function getCurrentUser(ctx:Context) {
	if( ctx.proxyId === null ) {
		ctx.req.respond({status:204});	// 204 "no content" 
		return;
	}
	const user = await app.getUser(ctx.proxyId);

	const headers = new Headers;
	headers.set('Content-Type', 'application/json');
	const resp: Response = {
		status: 200,
		headers: headers,
		body: JSON.stringify(user)
	};
	ctx.req.respond(resp);
}
