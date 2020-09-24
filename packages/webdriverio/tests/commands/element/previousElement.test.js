
import { remote } from '../../../src'

describe('previous element sibling test', () => {
    it('should return previous sibling of an element', async () => {
        const browser = await remote({
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        const previousEl = await elem.previousElement()

        expect(previousEl.elementId).toBe('some-previous-elem')
    })
})