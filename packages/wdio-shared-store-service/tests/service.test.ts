import { describe, expect, vi, beforeEach, afterEach, it } from 'vitest'

import { getValue, setValue, setPort } from '../src/client'
import SharedStoreService from '../src/service'
import type { SharedStoreServiceCapabilities } from '../build/types'

vi.mock('../src/client', () => ({
    getValue: vi.fn(),
    setValue: vi.fn(),
    setPort: vi.fn(),
}))

describe('SharedStoreService', () => {
    let storeService: SharedStoreService

    beforeEach(() => {
        const capabilities = {
            browserName: 'chrome',
            acceptInsecureCerts: true,
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
        expect(getValue).toBeCalledWith('foobar')
        expect(setValue).toBeCalledWith('foo', 'bar')
    })

    afterEach(() => {
        vi.mocked(setPort).mockClear()
        vi.mocked(getValue).mockClear()
        vi.mocked(setValue).mockClear()
    })
})
