// Note: to develop using live reload you must:
// - start vite in dev mode: $ yarn run dev
// - log into the scheduling tool at https://localhost:8089/scheduler/login.php
// - load html page of thing you're working on : https://localhost:8089/staff-requests.html
// Note: use HTTPS!

const { resolve } = require('path');
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
	clearScreen: false,
	build: {
		// rollupOptions: {
		// 	input: {
		// 		'staff-requests': resolve(__dirname, 'staff-requests.html'),
		// 	},
		// 	output: {
		// 		entryFileNames: `[name].js`,
		// 		chunkFileNames: `[name].js`,
		// 		assetFileNames: `[name].[ext]`,
		// 	},
		// },
		outDir: '../app/frontend/',
		sourcemap: true
	},
	server: {
		proxy: {
			'^\/api\/': {
				target: 'localhost:3003',
				changeOrigin: true,
				cookieDomainRewrite: ".localhost",
				secure: false,
				// configure: (proxy, options) => {
				// 	proxy.on("proxyReq", (proxyReq, req, res) => {
				// 		console.log("proxy req", req.url);
				// 		proxyReq.setHeader('x-dev-mode', 'frontend');
				// 	});
				// }
			},
		}
	},
	resolve: { alias: { '@': '/src' } },
	plugins: [vue()]
});