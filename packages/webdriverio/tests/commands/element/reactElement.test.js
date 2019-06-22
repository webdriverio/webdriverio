import request from 'request'
import { remote } from '../../../src'
import { ELEMENT_KEY } from '../../../src/constants'

describe('elem.react$', () => {
    it('does request to get React component with correct params', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#foo')

        await elem.react$(
            'MyComp',
            { some: 'props' },
            true,
        )
        expect(elem.elementId).toBe('some-elem-123')
        expect(request.mock.calls.pop()[0].body.args)
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
        await elem.react$('MyComp')

        expect(elem.elementId).toBe('some-elem-123')
        expect(request.mock.calls.pop()[0].body.args).toEqual([
            'MyComp',
            {},
            {},
            {
                ELEMENT: elem.elementId,
                [ELEMENT_KEY]: elem.elementId
            },
        ])
    })
})
