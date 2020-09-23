
import { remote } from '../../../src'

describe('parent element test', () => {
    it('should return parent element of an element', async () => {
        const browser = await remote({
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        const parentEl = await elem.parentEl()

        expect(parentEl.elementId).toBe('some-parent-elem')
    })
})
