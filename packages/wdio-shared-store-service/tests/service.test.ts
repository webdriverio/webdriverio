import { describe, expect, vi, beforeEach, afterEach, it } from 'vitest'

import { getValue, setValue, setPort, setResourcePool, getValueFromPool, addValueToPool } from '../src/client.js'
import SharedStoreService from '../src/service.js'
import type { SharedStoreServiceCapabilities } from '../build/types.js'

vi.mock('../src/client', () => ({
    getValue: vi.fn(),
    setValue: vi.fn(),
    setResourcePool: vi.fn(),
    getValueFromPool: vi.fn(),
    addValueToPool: vi.fn(),
    setPort: vi.fn(),
}))

describe('SharedStoreService', () => {
    let storeService: SharedStoreService

    beforeEach(() => {
        const capabilities = {
            browserName: 'chrome',
            'wdio:sharedStoreServicePort': 65209
        } as SharedStoreServiceCapabilities
        storeService = new SharedStoreService(null as never, capabilities)
    })

    it('constructor', async () => {
        expect(setPort).toBeCalledWith(65209)
    })

    it('beforeSession', () => {
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
