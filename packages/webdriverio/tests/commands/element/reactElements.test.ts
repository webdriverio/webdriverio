// @ts-ignore mocked (original defined in webdriver package)
import gotMock from 'got'
import { remote } from '../../../src'
import { ELEMENT_KEY } from '../../../src/constants'

const got = gotMock as any as jest.Mock

describe('elem.react$', () => {
    it('does request to get React component with correct params', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#foo')

        const options = {
            props: { some: 'props' },
            state: true
        }
        await elem.react$$('MyComp', options)
        expect(elem.elementId).toBe('some-elem-123')
        expect(got.mock.calls.pop()[1].json.args)
            .toEqual([
                'MyComp',
                { some: 'props' },
                true,
                {
                    ELEMENT: elem.elementId,
                    [ELEMENT_KEY]: elem.elementId
                },
            ])
    })

    it('does request to get React component with default params', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#foo')

        await elem.react$$('MyComp')
        expect(elem.elementId).toBe('some-elem-123')
        expect(got.mock.calls.pop()[1].json.args).toEqual([
            'MyComp',
            {},
            {},
            {
                ELEMENT: elem.elementId,
                [ELEMENT_KEY]: elem.elementId
            },
        ])
    })

    it('should call getElements with React flag true', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elems = await browser.react$$('myComp')

        expect(elems.filter(elem => elem.isReactElement).length).toBe(3)
        expect(elems.foundWith).toBe('react$$')
    })
})
