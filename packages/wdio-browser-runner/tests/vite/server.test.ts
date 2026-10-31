import url from 'node:url'
import path from 'node:path'
import { describe, it, vi, expect, afterEach, beforeEach } from 'vitest'
import { createServer } from 'vite'

import { ViteServer } from '../../src/vite/server.js'

vi.mock('../../src/vite/plugins/testrunner.js', () => ({
    testrunner: vi.fn().mockReturnValue('testrunner plugin')
}))
vi.mock('../../src/vite/plugins/mockHoisting.js', () => ({
    mockHoisting: vi.fn().mockReturnValue('mock hoisting plugin')
}))
vi.mock('../../src/vite/plugins/worker.js', () => ({
    workerPlugin: vi.fn().mockReturnValue('worker plugin')
}))
vi.mock('../../src/vite/constants.js', () => ({
    DEFAULT_VITE_CONFIG: { someDefault: 'config' },
    PRESET_DEPENDENCIES: { lit: ['foobar', 'default', { bar: 'foo' }] }
}))
vi.mock('@wdio/utils', () => ({
    executeHooksWithArgs: vi.fn().mockResolvedValue('hook result')
}))
vi.mock('../../src/vite/mock.js', () => ({
    MockHandler: class {}
}))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('foobar', () => ({ default: vi.fn().mockReturnValue('foobar') }))
vi.mock('vite')
vi.mock('get-port', () => ({ default: vi.fn().mockResolvedValue(1234) }))
vi.mock('vite-plugin-istanbul', () => ({
    default: vi.fn().mockReturnValue('istanbul plugin')
}))

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const consoleLog = console.log.bind(console)
const config: any = { rootDir: '/foo/bar' }

describe('ViteServer', () => {
    beforeEach(() => {
        console.log = vi.fn()
    })

    it('start', async () => {
        const server = new ViteServer({
            viteConfig: { foo: 'bar' } as any
        }, config, {
            some: 'optimizations'
        } as any)
        const viteServer = { listen: vi.fn() }
        vi.mocked(createServer).mockResolvedValue(viteServer as any)
        await server.start()

        expect(viteServer.listen).toBeCalledTimes(1)
        expect(createServer).toBeCalledWith({
            foo: 'bar',
            plugins: ['testrunner plugin', 'mock hoisting plugin', 'worker plugin'],
            root: expect.any(String),
            server: {
                port: 1234
            },
            some: 'optimizations',
            someDefault: 'config'
        })
    })

    it('start with a preset', async () => {
        const server = new ViteServer({
            preset: 'lit'
        }, config, {})
        const viteServer = { listen: vi.fn() }
        vi.mocked(createServer).mockResolvedValue(viteServer as any)
        await server.start()

        expect(viteServer.listen).toBeCalledTimes(1)
        expect(createServer).toBeCalledWith({
            plugins: ['testrunner plugin', 'mock hoisting plugin', 'worker plugin', 'foobar'],
            root: expect.any(String),
            server: {
                port: 1234
            },
            someDefault: 'config'
        })
    })

    it('start with a preset and custom viteConfig as string', async () => {
        const server = new ViteServer({
            preset: 'lit',
            viteConfig: './__fixtures__/vite.conf.ts'
        }, { rootDir: __dirname } as any, {})
        const viteServer = { listen: vi.fn() }
        vi.mocked(createServer).mockResolvedValue(viteServer as any)
        await server.start()

        expect(viteServer.listen).toBeCalledTimes(1)
        expect(createServer).toBeCalledWith({
            base: '/from-file',
            plugins: ['testrunner plugin', 'mock hoisting plugin', 'worker plugin', 'foobar'],
            root: expect.any(String),
            server: {
                port: 1234
            },
            someDefault: 'config'
        })
    })

    it('start with a preset and custom viteConfig as object', async () => {
        const userPlugin = { name: 'user-plugin' }
        const server = new ViteServer({
            preset: 'lit',
            viteConfig: {
                base: '/from-object',
                plugins: [userPlugin],
                server: { port: 3210 }
            }
        }, { rootDir: __dirname } as any, {})
        const viteServer = { listen: vi.fn() }
        vi.mocked(createServer).mockResolvedValue(viteServer as any)
        await server.start()

        expect(viteServer.listen).toBeCalledTimes(1)
        expect(createServer).toBeCalledWith({
            base: '/from-object',
            plugins: [userPlugin, 'testrunner plugin', 'mock hoisting plugin', 'worker plugin', 'foobar'],
            root: expect.any(String),
            server: {
                port: 1234
            },
            someDefault: 'config'
        })
    })

    for (const file of ['vite.fn.conf.ts', 'vite.promise.conf.ts']) {
        it(`start with a custom viteConfig file that exports a ${file.split('.')[1] === 'fn' ? 'function' : 'promise'}`, async () => {
            const userPlugin = { name: 'user-plugin' }
            ;(globalThis as any).__wdioUserVitePlugin__ = userPlugin
            const server = new ViteServer({
                viteConfig: `./__fixtures__/${file}`
            }, { rootDir: __dirname } as any, {})
            const viteServer = { listen: vi.fn() }
            vi.mocked(createServer).mockResolvedValue(viteServer as any)
            try {
                await server.start()
            } finally {
                delete (globalThis as any).__wdioUserVitePlugin__
            }

            expect(createServer).toBeCalledWith({
                base: '/from-file',
                define: { __FROM_USER__: JSON.stringify(file.includes('fn') ? 'development:serve' : 'promise') },
                plugins: [userPlugin, 'testrunner plugin', 'mock hoisting plugin', 'worker plugin'],
                root: expect.any(String),
                server: {
                    port: 1234
                },
                someDefault: 'config'
            })
        })
    }

    it('listens on all interfaces when host is set to a remote reachable address', async () => {
        const server = new ViteServer({ host: 'http://192.168.1.10' }, config, {})
        vi.mocked(createServer).mockResolvedValue({ listen: vi.fn() } as any)
        await server.start()
        expect(createServer).toBeCalledWith(expect.objectContaining({
            server: { host: '0.0.0.0', port: 1234 }
        }))
    })

    it('keeps listening on localhost when host is localhost', async () => {
        for (const host of ['http://localhost', 'localhost', 'localhost/']) {
            vi.mocked(createServer).mockClear()
            const server = new ViteServer({ host }, config, {})
            vi.mocked(createServer).mockResolvedValue({ listen: vi.fn() } as any)
            await server.start()
            expect(createServer).toBeCalledWith(expect.objectContaining({
                server: { port: 1234 }
            }))
        }
    })

    it('picks the listen address and allowed hosts for the host option', async () => {
        for (const [host, server] of [
            ['http://127.0.0.1', { host: '127.0.0.1' }],
            ['http://127.0.0.2:8080', { host: '127.0.0.2' }],
            ['http://[::1]', { host: '::1' }],
            ['http://[fd00::1]', { host: '::' }],
            ['192.168.1.10/', { host: '0.0.0.0' }],
            ['http://my-box.corp', { host: '0.0.0.0', allowedHosts: ['my-box.corp'] }]
        ] as const) {
            vi.mocked(createServer).mockClear()
            vi.mocked(createServer).mockResolvedValue({ listen: vi.fn() } as any)
            await new ViteServer({ host }, config, {}).start()
            expect(createServer).toBeCalledWith(expect.objectContaining({
                server: { ...server, port: 1234 }
            }))
        }
    })

    it('keeps the allowed hosts of the user', async () => {
        const server = new ViteServer({
            host: 'http://my-box.corp',
            viteConfig: { server: { allowedHosts: ['other.corp'] } }
        }, config, {})
        vi.mocked(createServer).mockResolvedValue({ listen: vi.fn() } as any)
        await server.start()
        expect(createServer).toBeCalledWith(expect.objectContaining({
            server: { host: '0.0.0.0', allowedHosts: ['my-box.corp', 'other.corp'], port: 1234 }
        }))
    })

    it('lets viteConfig.server.host override the host derived from the host option', async () => {
        const server = new ViteServer({
            host: 'http://192.168.1.10',
            viteConfig: { server: { host: '192.168.1.10' } }
        }, config, {})
        vi.mocked(createServer).mockResolvedValue({ listen: vi.fn() } as any)
        await server.start()
        expect(createServer).toBeCalledWith(expect.objectContaining({
            server: { host: '192.168.1.10', port: 1234 }
        }))
    })

    it('start with coverage enabled', async () => {
        const server = new ViteServer({
            coverage: {
                enabled: true,
                exclude: ['foo']
            }
        }, config, {})
        const viteServer = { listen: vi.fn() }
        vi.mocked(createServer).mockResolvedValue(viteServer as any)
        await server.start()

        expect(viteServer.listen).toBeCalledTimes(1)
        expect(createServer).toBeCalledWith({
            plugins: ['testrunner plugin', 'mock hoisting plugin', 'worker plugin', 'istanbul plugin'],
            root: expect.any(String),
            server: {
                port: 1234
            },
            someDefault: 'config'
        })

        const istanbulPlugin = await import('vite-plugin-istanbul')
        expect(istanbulPlugin.default).toBeCalledWith({
            cwd: '/foo/bar',
            enabled: true,
            exclude: [
                '**/node_modules/**',
                '**/.git/**',
                '**/.github/**',
                '**/.nuxt/**',
                '**/.output/**',
                '**/.dist/**',
                '**/.cache/**',
                '**/packages/wdio-browser-runner/**',
                '**/packages/wdio-utils/**',
                '../packages/wdio-browser-runner/**',
                '../packages/wdio-utils/**',
                '**/*.test.*',
                '**/*.spec.*',
                'foo'
            ],
            extension: ['.js', '.cjs', '.mjs', '.ts', '.mts', '.cts', '.tsx', '.jsx', '.vue', '.svelte', '.html'],
            forceBuildInstrument: true,
            include: ['**']
        })
    })

    afterEach(() => {
        vi.mocked(createServer).mockClear()
        console.log = consoleLog
    })
})
