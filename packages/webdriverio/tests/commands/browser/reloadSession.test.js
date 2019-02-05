import request from 'request'
import { remote } from '../../../src'

describe('reloadSession test', () => {
    it('should allow to check if an element is enabled', async () => {
        const hook = jest.fn()
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            },
            onReload: [hook]
        })

        await browser.reloadSession()

        expect(request.mock.calls[1][0].method).toBe('DELETE')
        expect(request.mock.calls[1][0].uri.pathname).toBe('/wd/hub/session/foobar-123')
        expect(request.mock.calls[2][0].method).toBe('POST')
        expect(request.mock.calls[2][0].uri.pathname).toBe('/wd/hub/session')
        expect(hook).toBeCalledWith('foobar-123', undefined)
    })
})
