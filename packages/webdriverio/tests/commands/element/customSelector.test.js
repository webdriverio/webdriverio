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

    it('should error if no strategy found', async () => {
        const elem = await browser.$('#foo')
        const error = await elem.custom$('test', '.foo').catch((err) => err)
        expect(error.message).toBe('No strategy found for test')
    })

    it('should fetch element', async () => {
        browser.addLocatorStrategy('test', (selector, parent) => (
            { 'element-6066-11e4-a52e-4f735466cecf': `${selector}-${parent}` }
        ))

        const elem = await browser.$('.foo')
        const custom = await elem.custom$('test', '.test')
        expect(custom.elementId).toBe('.test-some-elem-123')
    })

    it('should throw an error if root element does not exist', async () => {
        browser.addLocatorStrategy('test', () => null)

        const elem = await browser.$('#nonexisting')
        const error = await elem.custom$('test', '.test').catch((err) => err)
        expect(error.message).toContain('because element wasn\'t found')
    })

    it('should fetch element one element even if the script returns multiple', async () => {
        browser.addLocatorStrategy('test', () => [
            { 'element-6066-11e4-a52e-4f735466cecf': 'some elem' },
            { 'element-6066-11e4-a52e-4f735466cecf': 'some other elem' }
        ])

        const elem = await browser.$('.foo')
        const custom = await elem.custom$('test', '.test')
        expect(custom.elementId).toBe('some elem')
    })

    it('should allow to find a custom element on a custom element', async () => {
        browser.addLocatorStrategy('test', () => [
            { 'element-6066-11e4-a52e-4f735466cecf': 'some elem' },
            { 'element-6066-11e4-a52e-4f735466cecf': 'some other elem' }
        ])

        const elem = await browser.custom$('test', '.test')
        const custom = await elem.custom$('test', '.test')
        expect(custom.elementId).toBe('some elem')
    })

    it('should throw error if no element is returned from the user script', async () => {
        browser.addLocatorStrategy('test-no-element', () => null)
        const elem = await browser.$('#foo')
        const err = await elem.custom$('test-no-element', '.foo').catch(err => err)

        expect(err.message).toBe('Your locator strategy script must return an element')
    })
})
