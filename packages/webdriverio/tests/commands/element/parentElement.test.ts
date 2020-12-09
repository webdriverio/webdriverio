import { remote } from '../../../src'

describe('parent element test', () => {
    it('should return parent element of an element', async () => {
        const browser = await remote({
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        const subElem = await elem.$('#bar')
        const parentEl = await subElem.parentElement()

        expect(parentEl.elementId).toBe('some-parent-elem')
    })

    it('should throw error if parent element does not exist', async () => {
        const browser = await remote({
            waitforInterval: 1,
            waitforTimeout: 1,
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        const parentElem = await elem.parentElement()

        const err = await parentElem.click().catch((err) => err)
        expect(err.message)
            .toContain('parent element of element with selector "#foo"')
    })
})
