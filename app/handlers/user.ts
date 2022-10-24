import { Context } from 'https://deno.land/x/dropserver_app@v0.2.1/mod.ts';
import app from '../app.ts';

export async function getCurrentUser(ctx:Context) {
	if( ctx.proxyId === null ) {
		ctx.respondWith(new Response("", {status:204}));	// 204 "no content" 
		return;
	}
	const user = await app.getUser(ctx.proxyId);

	ctx.respondJson(user);
}
