import { describe, expect, vi, afterEach, it } from 'vitest'

import { getValue, setValue, setPort, setResourcePool, getValueFromPool, addValueToPool } from '../src/client.js'
import SharedStoreService from '../src/service.js'
import { CUSTOM_CAP } from '../src/constants.js'
import type { SharedStoreServiceCapabilities } from '../src/types.js'

vi.mock('../src/client', () => ({
    getValue: vi.fn(),
    setValue: vi.fn(),
    setResourcePool: vi.fn(),
    getValueFromPool: vi.fn(),
    addValueToPool: vi.fn(),
    setPort: vi.fn(),
}))

describe('SharedStoreService', () => {
    const capabilities = {
        browserName: 'chrome',
        [CUSTOM_CAP]: 65209
    } as SharedStoreServiceCapabilities

    describe('sets port correctly', () => {
        it('using standard caps', async () => {
            new SharedStoreService(null as never, capabilities)
            expect(setPort).toBeCalledWith(65209)
        })

        it('using w3c caps', async () => {
            const c = { alwaysMatch: capabilities, firstMatch: [] }
            new SharedStoreService(null as never, c)
            expect(setPort).toBeCalledWith(65209)
        })

        it('using multiremote caps', async () => {
            new SharedStoreService(null as never, {
                browserA: { capabilities },
                browserB: { capabilities }
            })
            expect(setPort).toBeCalledWith(65209)
        })
    })

    it('beforeSession', () => {
        const storeService = new SharedStoreService(null as never, capabilities)
        const browser = { call: (fn: Function) => fn() }
        storeService.before({} as never, [] as never, browser as any)
        storeService['_browser']?.sharedStore.get('foobar')
        storeService['_browser']?.sharedStore.set('foo', 'bar')
        storeService['_browser']?.sharedStore.setResourcePool('foo', ['bar'])
        storeService['_browser']?.sharedStore.getValueFromPool('foo', { timeout: 1 })
        storeService['_browser']?.sharedStore.addValueToPool('foo', 'bar2')
        expect(getValue).toBeCalledWith('foobar')
        expect(setValue).toBeCalledWith('foo', 'bar')
        expect(setResourcePool).toBeCalledWith('foo', ['bar'])
        expect(getValueFromPool).toBeCalledWith('foo', { timeout: 1 })
        expect(addValueToPool).toBeCalledWith('foo', 'bar2')
    })

    afterEach(() => {
        vi.mocked(setPort).mockClear()
        vi.mocked(getValue).mockClear()
        vi.mocked(setValue).mockClear()
    })
})
