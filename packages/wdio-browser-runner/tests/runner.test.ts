import path from 'node:path'

import { expect, describe, it, vi, beforeEach } from 'vitest'
import LocalRunner from '@wdio/local-runner'

import { SESSIONS, BROWSER_POOL } from '../src/constants.js'
import BrowserRunner from '../src/index.js'

vi.mock('webdriverio')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('@wdio/local-runner')
vi.mock('../src/vite/server.js', () => ({
    ViteServer: class {
        start = vi.fn()
        close = vi.fn()
        config = { server: { port: 1234 } }
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

// export default class BrowserRunner extends LocalRunner {

//     run (runArgs: RunArgs) {
//         runArgs.caps = makeHeadless(this.options, runArgs.caps)

//         if (runArgs.command === 'run') {
//             runArgs.args.baseUrl = this._config.baseUrl
//         }

//         const worker = super.run(runArgs)
//         worker.on('message', async (payload: SessionStartedMessage | SessionEndedMessage) => {
//             if (payload.name === 'sessionStarted' && !SESSIONS.has(payload.cid!)) {
//                 SESSIONS.set(payload.cid!, {
//                     args: this.#config.mochaOpts || {},
//                     config: this.#config,
//                     capabilities: payload.content.capabilities,
//                     sessionId: payload.content.sessionId,
//                     injectGlobals: payload.content.injectGlobals
//                 })
//                 BROWSER_POOL.set(payload.cid!, await attach({
//                     ...this.#config,
//                     ...payload.content,
//                     options: {
//                         ...this.#config,
//                         ...payload.content
//                     }
//                 }))
//             }

//             if (payload.name === 'sessionEnded') {
//                 SESSIONS.delete(payload.cid)
//                 BROWSER_POOL.delete(payload.cid)
//             }
//         })

//         return worker
//     }

//     /**
//      * shutdown vite server
//      *
//      * @return {Promise}  resolves when vite server has been shutdown
//      */
//     async shutdown() {
//         await super.shutdown()
//         await this.#server.close()
//     }
// }

// declare global {
//     namespace WebdriverIO {
//         interface BrowserRunnerOptions extends BrowserRunnerOptionsImport {}
//     }
// }
