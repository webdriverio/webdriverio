import path from 'node:path'

import { expect, describe, it, vi, beforeEach } from 'vitest'
import LocalRunner from '@wdio/local-runner'

import { SESSIONS, BROWSER_POOL } from '../src/constants.js'
import BrowserRunner from '../src/index.js'

vi.mock('webdriverio', () => import(path.join(process.cwd(), '__mocks__', 'webdriverio')))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('@wdio/local-runner')
vi.mock('../src/vite/server.js', () => ({
    ViteServer: class {
        start = vi.fn()
        close = vi.fn()
        config = { server: { port: 1234 } }
        on = vi.fn()
    }
}))

describe('BrowserRunner', () => {
    beforeEach(() => {
        delete process.env.CI
    })

    it('should throw if framework is not Mocha', () => {
        expect(() => new BrowserRunner({}, {} as any)).toThrow()
        expect(() => new BrowserRunner({}, {
            framework: 'jasmine'
        } as any)).toThrow()
        expect(() => new BrowserRunner({}, {
            framework: 'mocha'
        } as any)).not.toThrow()
    })

    it('initialise', async () => {
        const runner = new BrowserRunner({}, {
            framework: 'mocha'
        } as any)
        await runner.initialise()
        expect(runner['_config'].baseUrl).toBe('http://localhost:1234')
    })

    it('run', async () => {
        const runner = new BrowserRunner({}, {
            framework: 'mocha'
        } as any)
        await runner.initialise()

        const on = vi.fn()
        vi.mocked(LocalRunner.prototype.run).mockReturnValue({ on } as any)
        const worker = runner.run({ caps: { browserName: 'chrome' }, command: 'run', args: {} } as any)
        expect(worker).toBeDefined()
        expect(LocalRunner.prototype.run).toBeCalledWith({
            args: { baseUrl: 'http://localhost:1234' },
            caps: { browserName: 'chrome' },
            command: 'run'
        })

        expect(BROWSER_POOL.size).toBe(0)
        expect(SESSIONS.size).toBe(0)
        await on.mock.calls[0][1]({ name: 'sessionStarted', cid: '0-0', content: {} })
        expect(BROWSER_POOL.size).toBe(1)
        expect(SESSIONS.size).toBe(1)

        await on.mock.calls[0][1]({ name: 'sessionEnded', cid: '0-1', content: {} })
        expect(BROWSER_POOL.size).toBe(1)
        expect(SESSIONS.size).toBe(1)
        await on.mock.calls[0][1]({ name: 'sessionEnded', cid: '0-0', content: {} })
        expect(BROWSER_POOL.size).toBe(0)
        expect(SESSIONS.size).toBe(0)
    })

    it('shutdown', async () => {
        const runner = new BrowserRunner({}, {
            framework: 'mocha'
        } as any)
        await runner.initialise()
        await runner.shutdown()
        expect(LocalRunner.prototype.shutdown).toBeCalledTimes(1)
    })
})
