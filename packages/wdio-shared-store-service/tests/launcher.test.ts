import path from 'node:path'
import { describe, expect, vi, it } from 'vitest'

import { setPort } from '../src/client.js'
import SharedStoreLauncher from '../src/launcher.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

vi.mock('../src/server', () => ({
    startServer: () => Promise.resolve({ port: 3000 })
}))

vi.mock('../src/client', () => ({
    setPort: vi.fn()
}))

const storeLauncher = new SharedStoreLauncher()

describe('SharedStoreService', () => {
    describe('should update capabilities correctly', () => {
        it('using standard caps', async () => {
            const capabilities = [{ browserName: 'chrome' }]
            await storeLauncher.onPrepare(null as never, capabilities)
            expect(capabilities).toMatchSnapshot()
            expect(setPort).toBeCalledWith(3000)
        })

        it('using w3c caps', async () => {
            const capabilities = [{ alwaysMatch: { browserName: 'chrome' }, firstMatch: [] }]
            await storeLauncher.onPrepare(null as never, capabilities)
            expect(capabilities).toMatchSnapshot()
            expect(setPort).toBeCalledWith(3000)
        })

        it('using multiremote caps', async () => {
            const capabilities = {
                browserA: { capabilities: { browserName: 'chrome' } },
                browserB: { capabilities: { browserName: 'firefox' } }
            }
            await storeLauncher.onPrepare(null as never, capabilities)
            expect(capabilities).toMatchSnapshot()
            expect(setPort).toBeCalledTimes(3)
            expect(setPort).toBeCalledWith(3000)
        })

        it('using parallel multiremote caps', async () => {
            const capabilities = [{
                browserA: { capabilities: { browserName: 'chrome' } },
                browserB: { capabilities: { browserName: 'firefox' } }
            }]
            await storeLauncher.onPrepare(null as never, capabilities)
            expect(capabilities).toMatchSnapshot()
            expect(setPort).toBeCalledWith(3000)
        })
    })

    describe('should close the server in onComplete hook', () => {
        it('using parallel caps', async () => {
            const app = {
                server: { close: vi.fn((cb) => process.nextTick(cb)) }
            }
            storeLauncher['_app'] = app
            await storeLauncher.onComplete()

            expect(app.server.close).toBeCalledTimes(1)
        })
    })
})
