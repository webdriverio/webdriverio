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
        browser.addLocatorStrategy('test', (selector, parent) => [
            { 'element-6066-11e4-a52e-4f735466cecf': `${selector}-${parent}` },
            { 'element-6066-11e4-a52e-4f735466cecf': `${selector}-other-${parent}` }
        ])

        const elem = await browser.$('#foo')
        const elems = await elem.custom$$('test', '.test')

        expect(elems).toHaveLength(2)
        expect(elems[0].elementId).toBe('.test-some-elem-123')
        expect(elems[1].elementId).toBe('.test-other-some-elem-123')
    })

    it('should error if no strategy found', async () => {
        const elem = await browser.$('#foo')
        const err = await elem.custom$$('test', '.foo').catch(err => err)
        expect(err.message).toBe('No strategy found for test')
    })

    it('should throw an error if root element does not exist', async () => {
        browser.addLocatorStrategy('test', () => null)

        const elem = await browser.$('#nonexisting')
        const error = await elem.custom$$('test', '.test').catch((err) => err)
        expect(error.message).toContain('because element wasn\'t found')
    })

    it('should return array even if the script returns one element', async () => {
        browser.addLocatorStrategy('test', (selector, parent) => (
            { 'element-6066-11e4-a52e-4f735466cecf': `${selector}-${parent}` }
        ))

        const elem = await browser.$('#foo')
        const elems = await elem.custom$$('test', '.test')

        expect(elems).toHaveLength(1)
        expect(elems[0].elementId).toBe('.test-some-elem-123')
    })

    it('should return an empty array if no elements are returned from script', async () => {
        browser.addLocatorStrategy('test-no-element', () => null)

        const elem = await browser.$('#foo')
        const elems = await elem.custom$$('test-no-element', '.test')

        expect(elems).toMatchObject([])
    })
})
