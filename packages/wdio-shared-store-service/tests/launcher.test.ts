import type { SharedStoreServiceCapabilities } from '../src/types'
import { setPort } from '../src/client'
import SharedStoreLauncher from '../src/launcher'
import StoreServerType from '../src/server'
const StoreServer: typeof StoreServerType = require('../src/server').default

const { stopServer } = StoreServer

jest.mock('../src/server', () => ({
    default: {
        startServer: async () => ({ port: 3000 }),
        stopServer: jest.fn(),
    }
}))
jest.mock('../src/client', () => ({
    setPort: jest.fn()
}))

const storeLauncher = new SharedStoreLauncher()

describe('SharedStoreService', () => {
    it('onPrepare', async () => {
        const capabilities = [{ browserName: 'chrome', acceptInsecureCerts: true }] as SharedStoreServiceCapabilities[]
        await storeLauncher.onPrepare(null as never, capabilities)
        expect(setPort).toBeCalledWith(3000)
    })

    // Fix for https://github.com/webdriverio/webdriverio/issues/8335
    /* it('onComplete', async () => {
        await storeLauncher.onComplete()
        expect(stopServer).toBeCalled()
    }) */

    afterEach(() => {
        (stopServer as jest.Mock).mockClear()
    })
})
