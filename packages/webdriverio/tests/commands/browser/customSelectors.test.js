import { remote } from '../../../src'

describe('custom$', () => {
    let browser

    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should fetch element', async () => {
        browser.addLocatorStrategy('test', (selector) => [
            { 'element-6066-11e4-a52e-4f735466cecf': `${selector}-foobar` },
            { 'element-6066-11e4-a52e-4f735466cecf': `${selector}-other-foobar` }
        ])

        const elems = await browser.custom$$('test', '.test')

        expect(elems).toHaveLength(2)
        expect(elems[0].elementId).toBe('.test-foobar')
        expect(elems[1].elementId).toBe('.test-other-foobar')
    })

    it('should error if no strategy found', async () => {
        const elem = await browser.$('#foo')
        const err = await elem.custom$$('test', '.foo').catch(err => err)
        expect(err.message).toBe('No strategy found for test')
    })

    it('should return array even if the script returns one element', async () => {
        browser.addLocatorStrategy('test', (selector) => (
            { 'element-6066-11e4-a52e-4f735466cecf': `${selector}-foobar` }
        ))

        const elems = await browser.custom$$('test', '.test')

        expect(elems).toHaveLength(1)
        expect(elems[0].elementId).toBe('.test-foobar')
    })

    it('should return an empty array if no elements are returned from script', async () => {
        browser.addLocatorStrategy('test-no-element', () => null)
        const elems = await browser.custom$$('test-no-element', '.test')
        expect(elems).toMatchObject([])
    })
})
