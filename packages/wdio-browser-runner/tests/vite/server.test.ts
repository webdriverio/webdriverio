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
vi.mock('ws', () => ({
    WebSocketServer: class {
        on = vi.fn()
    }
}))
vi.mock('foobar', () => ({ default: vi.fn().mockReturnValue('foobar') }))
vi.mock('vite')
vi.mock('get-port', () => ({ default: vi.fn().mockResolvedValue(1234) }))

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
                host: '0.0.0.0',
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
                port: 1234,
                host: '0.0.0.0'
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
            plugins: ['testrunner plugin', 'mock hoisting plugin', 'worker plugin', 'foobar'],
            root: expect.any(String),
            server: {
                port: 3210,
                host: '0.0.0.0'
            },
            someDefault: 'config'
        })
    })

    it('start with a preset and custom viteConfig as object', async () => {
        const server = new ViteServer({
            preset: 'lit',
            viteConfig: { server: { port: 3210 } }
        }, { rootDir: __dirname } as any, {})
        const viteServer = { listen: vi.fn() }
        vi.mocked(createServer).mockResolvedValue(viteServer as any)
        await server.start()

        expect(viteServer.listen).toBeCalledTimes(1)
        expect(createServer).toBeCalledWith({
            plugins: ['testrunner plugin', 'mock hoisting plugin', 'worker plugin', 'foobar'],
            root: expect.any(String),
            server: {
                port: 3210,
                host: '0.0.0.0'
            },
            someDefault: 'config'
        })
    })

    afterEach(() => {
        vi.mocked(createServer).mockClear()
        console.log = consoleLog
    })
})
