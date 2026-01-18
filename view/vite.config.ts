import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
    const environment = loadEnv(mode, process.cwd(), '')
    const port = Number(environment.SERVICE_PORT)

    return ({
        mode,
        define: {
            'import.meta.env.ENV_VARIABLE': JSON.stringify(environment.ENV_VARIABLE),
            'process.env': {},
            process: 'window.process',
        },
        envDir: '..',
        plugins: [ vue() ],
        build: {
            outDir: '../public',
            emptyOutDir: true,
            sourcemap: environment.DEV ? 'inline' : 'hidden',
            commonjsOptions: { include: [ /node_modules/ ], },
        },
        optimizeDeps: { exclude: [ '@vk-public/logger' ], },
        resolve: {
            alias: [
                {
                    find: /^#/,
                    replacement: fileURLToPath(new URL('src/', import.meta.url)).replaceAll('\\', '/'),
                },
                {
                    find: '@vk-public/logger',
                    replacement: fileURLToPath(new URL('src/shims/logger.ts', import.meta.url)).replaceAll('\\', '/'),
                },
            ],
        },
        server: {
            port,
            // Expose to all network interfaces, required for Docker
            host: '0.0.0.0',
            allowedHosts: true,
            proxy: {
                '/api': {
                    // eslint-disable-next-line sonarjs/no-clear-text-protocols
                    target: environment.VITE_API_URL || 'http://localhost:9000',
                    changeOrigin: true,
                }
            }
        },
    })
})
