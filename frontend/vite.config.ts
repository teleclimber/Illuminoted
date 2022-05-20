import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
		proxy: {
			'^\/api\/': {
				target: 'http://localhost:3003',
				changeOrigin: true,
				cookieDomainRewrite: ".localhost",
				secure: false,
				configure: (proxy, options) => {
					proxy.on("proxyReq", (proxyReq, req, res) => {
						console.log("proxy req", req.url);
						//proxyReq.setHeader('x-dev-mode', 'frontend');
					});
				}
			},
		}
	},
  plugins: [vue()]
})
