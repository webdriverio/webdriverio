import { getValue, setValue, setPort } from '../src/client'
import SharedStoreService from '../src/service'
import type { SharedStoreServiceCapabilities } from '../build/types'

jest.mock('../src/client', () => ({
    getValue: jest.fn(),
    setValue: jest.fn(),
    setPort: jest.fn(),
}))

describe('SharedStoreService', () => {
    let storeService: SharedStoreService

    beforeEach(() => {
        const capabilities = { browserName: 'chrome', acceptInsecureCerts: true, 'wdio:sharedStoreServicePort': '65209' } as SharedStoreServiceCapabilities
        storeService = new SharedStoreService(null as never, capabilities)
    })

    it('constructor', async () => {
        expect(setPort).toBeCalledWith('65209')
    })

    it('beforeSession', () => {
        const browser = { call: (fn: Function) => fn() } as WebdriverIO.Browser
        storeService.before({}, [], browser)
        storeService['_browser']?.sharedStore.get('foobar')
        storeService['_browser']?.sharedStore.set('foo', 'bar')
        expect(getValue).toBeCalledWith('foobar')
        expect(setValue).toBeCalledWith('foo', 'bar')
    })

    afterEach(() => {
        (setPort as jest.Mock).mockClear()
        ;(getValue as jest.Mock).mockClear()
        ;(setValue as jest.Mock).mockClear()
    })
})
