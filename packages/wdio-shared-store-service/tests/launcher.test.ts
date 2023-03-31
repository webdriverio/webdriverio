import path from 'node:path'
import { describe, expect, vi, it } from 'vitest'

import { setPort } from '../src/client.js'
import SharedStoreLauncher from '../src/launcher.js'
import type { SharedStoreServiceCapabilities } from '../src/types.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

vi.mock('../src/server', () => ({
    startServer: () => Promise.resolve({ port: 3000 })
}))

vi.mock('../src/client', () => ({
    setPort: vi.fn()
}))

const storeLauncher = new SharedStoreLauncher()

describe('SharedStoreService', () => {
    it('onPrepare', async () => {
        const capabilities = [{ browserName: 'chrome', acceptInsecureCerts: true }] as SharedStoreServiceCapabilities[]
        await storeLauncher.onPrepare(null as never, capabilities)
        expect(setPort).toBeCalledWith(3000)
    })
})
