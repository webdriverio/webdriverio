import path from 'node:path'
import { expect, describe, it, beforeEach, vi } from 'vitest'
import { remote } from '../../../src/index.js'
import type { CustomStrategyReference } from '../../../src/types.js'

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

    it('should fetch element', async () => {
        browser.addLocatorStrategy('test', (selector: string) => (
            { 'element-6066-11e4-a52e-4f735466cecf': `${selector}-foobar` }
        ) as any)

        const elem = await browser.custom$('test', '.test')
        expect(elem.elementId).toBe('.test-foobar')
        expect(typeof elem.selector).toBe('object')
        expect(typeof (elem.selector as CustomStrategyReference).strategy).toBe('function')
        expect((elem.selector as CustomStrategyReference).strategyName).toBe('test')
        expect((elem.selector as CustomStrategyReference).strategyArguments).toHaveLength(1)
        expect((elem.selector as CustomStrategyReference).strategyArguments[0]).toBe('.test')
    })

    it('should error if no strategy found', async () => {
        const error = await browser.custom$('test', '.foo')
            // @ts-ignore use of sync types
            .catch((err: Error) => err) as Error
        expect(error.message).toBe('No strategy found for test')
    })

    it('should fetch element one element even if the script returns multiple', async () => {
        browser.addLocatorStrategy('test', () => [
            { 'element-6066-11e4-a52e-4f735466cecf': 'some elem' },
            { 'element-6066-11e4-a52e-4f735466cecf': 'some other elem' }
        ] as any)

        const elem = await browser.custom$('test', '.test')
        expect(elem.elementId).toBe('some elem')
    })

    it('should throw error if no element is returned from the user script', async () => {
        browser.addLocatorStrategy('test-no-element', () => null as any)
        const err = await browser.custom$('test-no-element', '.foo')
            // @ts-ignore use of sync types
            .catch((err: Error) => err) as Error

        expect(err.message).toBe('Your locator strategy script must return an element')
    })
})
