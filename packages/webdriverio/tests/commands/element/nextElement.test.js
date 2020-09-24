
import { remote } from '../../../src'

describe('next element sibling test', () => {
    it('should return next sibling of an element', async () => {
        const browser = await remote({
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        const nextEl = await elem.nextElement()

        expect(nextEl.elementId).toBe('some-next-elem')
    })
})