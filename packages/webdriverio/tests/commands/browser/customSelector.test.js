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
        browser.addLocatorStrategy('test', (selector) => (
            { 'element-6066-11e4-a52e-4f735466cecf': `${selector}-foobar` }
        ))

        const elem = await browser.custom$('test', '.test')
        expect(elem.elementId).toBe('.test-foobar')
    })

    it('should error if no strategy found', async () => {
        const error = await browser.custom$('test', '.foo').catch((err) => err)
        expect(error.message).toBe('No strategy found for test')
    })

    it('should fetch element one element even if the script returns multiple', async () => {
        browser.addLocatorStrategy('test', () => [
            { 'element-6066-11e4-a52e-4f735466cecf': 'some elem' },
            { 'element-6066-11e4-a52e-4f735466cecf': 'some other elem' }
        ])

        const elem = await browser.custom$('test', '.test')
        expect(elem.elementId).toBe('some elem')
    })

    it('should throw error if no element is returned from the user script', async () => {
        browser.addLocatorStrategy('test-no-element', () => null)
        const elem = await browser.$('#foo')
        const err = await elem.custom$('test-no-element', '.foo').catch(err => err)

        expect(err.message).toBe('Your locator strategy script must return an element')
    })
})
