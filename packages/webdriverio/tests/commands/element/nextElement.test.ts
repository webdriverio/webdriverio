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

    it('should throw error if next element does not exist', async () => {
        const browser = await remote({
            waitforInterval: 1,
            waitforTimeout: 1,
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$$('#foo')
        const nextElem = await elem[2].nextElement()

        const err = await nextElem.click().catch((err) => err)
        expect(err.message)
            .toContain('next element of element with selector "#foo"')
    })
})
