import { remote } from '../../../src'
import { waitToLoadReact, resq$ } from 'resq'

jest.mock('resq', () => ({
    waitToLoadReact: jest.fn(),
    resq$: jest.fn()
}))

let browser
beforeEach(async () => {
    browser = await remote({
        capabilities: {
            browser: 'foobar'
        }
    })
})

afterEach(() => browser = null)

describe('react$', () => {
    it('should exist in broswer object', () => {
        expect(browser.react$).toBeTruthy()
    })

    it('should call `waitToLoadReact`', async () => {
        await browser.react$('Foo')

        expect(waitToLoadReact).toHaveBeenCalled()
        expect(waitToLoadReact).toHaveBeenCalledWith(undefined, undefined)
    })

    it('should call `waitToLoadReact` with correct options', async () => {
        await browser.react$('Foo', { timeout: 2000, rootElement: '#foobar' })

        expect(waitToLoadReact).toHaveBeenCalled()
        expect(waitToLoadReact).toHaveBeenCalledWith(2000, '#foobar')
    })

    it('should call `waitToLoadReact`', async () => {
        await browser.react$('Foo')

        expect(resq$).toHaveBeenCalled()
        expect(resq$).toHaveBeenCalledWith('Foo')
    })
})
