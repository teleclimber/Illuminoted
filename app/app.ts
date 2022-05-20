import {createApp} from './deps.ts';

import createRoutes from './routes.ts';

console.log("creating app");

const app = createApp({
	routes: createRoutes,
	migrations: async () => {
		const {default: createMigrations} = await import('./migrations.ts');
		return createMigrations();
	}
});

console.log("created app");

export default app;