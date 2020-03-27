import got from 'got'
import { remote } from '../../../src'

describe('react$', () => {
    it('should fetch an React component', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const options = {
            props: { some: 'props' },
            state: { some: 'state' }
        }
        const elem = await browser.react$('myComp', options)

        expect(elem.elementId).toBe('some-elem-123')
        expect(got).toBeCalledTimes(4)
        expect(got.mock.calls.pop()[1].json.args)
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
        expect(got.mock.calls.pop()[1].json.args).toEqual(['myComp', {}, {}])
    })

    it('should call getElement with React flag true', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.react$('SomeCmp')
        expect(elem.isReactElement).toBe(true)
    })

    afterEach(() => {
        got.mockClear()
    })
})
