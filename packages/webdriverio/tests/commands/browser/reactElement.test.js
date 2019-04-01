import request from 'request'
import { remote } from '../../../src'

describe('react$', () => {
    it('should fetch an React component', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.react$(
            'myComp',
            { some: 'props' },
            { some: 'state' }
        )

        expect(elem.elementId).toBe('some-elem-123')
        expect(request).toBeCalledTimes(4)
        expect(request.mock.calls.pop()[0].body.args)
            .toEqual(['myComp', { some: 'props' }, { some: 'state' }])
    })

    it('should default state and props to empty object', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        await browser.react$('myComp')
        expect(request.mock.calls.pop()[0].body.args).toEqual(['myComp', {}, {}])
    })

    it('should set error object if no element could be found', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        return expect(browser.react$('myNonExistingComp')).rejects.toThrow(
            new Error('React element with selector "myNonExistingComp" wasn\'t found'))
    })

    afterEach(() => {
        request.mockClear()
    })
})
