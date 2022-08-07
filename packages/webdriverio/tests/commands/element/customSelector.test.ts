import path from 'node:path'
import { expect, describe, it, beforeEach, vi } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('custom$', () => {
    let browser: WebdriverIO.Browser

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
        const error = await elem.custom$('test', '.foo')
            // @ts-ignore uses sync commands
            .catch((err: Error) => err)
        expect((error as Error).message).toBe('No strategy found for test')
    })

    it('should fetch element', async () => {
        // @ts-ignore mock feature
        browser.addLocatorStrategy('test', (selector: string, parent: string) => (
            { 'element-6066-11e4-a52e-4f735466cecf': `${selector}-${parent}` }
        ) as any as HTMLElement)

        const elem = await browser.$('.foo')
        const custom = await elem.custom$('test', '.test')
        expect(custom.elementId).toBe('.test-some-elem-123')
    })

    it('should throw an error if root element does not exist', async () => {
        // @ts-ignore test invalid parameter
        browser.addLocatorStrategy('test', () => null)

        const elem = await browser.$('#nonexisting')
        const error = await elem.custom$('test', '.test')
            // @ts-ignore uses sync commands
            .catch((err: Error) => err)
        expect((error as Error).message).toContain('because element wasn\'t found')
    })

    it('should fetch element one element even if the script returns multiple', async () => {
        browser.addLocatorStrategy('test', () => [
            { 'element-6066-11e4-a52e-4f735466cecf': 'some elem' },
            { 'element-6066-11e4-a52e-4f735466cecf': 'some other elem' }
        ] as any as HTMLElement[])

        const elem = await browser.$('.foo')
        const custom = await elem.custom$('test', '.test')
        expect(custom.elementId).toBe('some elem')
    })

    it('should allow to find a custom element on a custom element', async () => {
        browser.addLocatorStrategy('test', () => [
            { 'element-6066-11e4-a52e-4f735466cecf': 'some elem' },
            { 'element-6066-11e4-a52e-4f735466cecf': 'some other elem' }
        ] as any as HTMLElement[])

        const elem = await browser.custom$('test', '.test')
        const custom = await elem.custom$('test', '.test')
        expect(custom.elementId).toBe('some elem')
    })

    it('should throw error if no element is returned from the user script', async () => {
        // @ts-ignore test invalid parameter
        browser.addLocatorStrategy('test-no-element', () => null)
        const elem = await browser.$('#foo')
        const err = await elem.custom$('test-no-element', '.foo')
            // @ts-ignore uses sync commands
            .catch(err => err)

        expect(err.message).toBe('Your locator strategy script must return an element')
    })
})
