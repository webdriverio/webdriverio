import path from 'node:path'
import { expect, describe, it, beforeEach, vi } from 'vitest'
import type { CustomStrategyReference } from '../../../src/index.js'
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

    it('should fetch element', async () => {
        browser.addLocatorStrategy('test', (selector: string) => [
            { 'element-6066-11e4-a52e-4f735466cecf': `${selector}-foobar` },
            { 'element-6066-11e4-a52e-4f735466cecf': `${selector}-other-foobar` }
        ] as any)

        const elems = await browser.custom$$('test', '.test')

        expect(elems).toHaveLength(2)
        expect(typeof elems.selector).toBe('string')
        expect(typeof elems[0].selector).toBe('object')
        expect(typeof (elems[0].selector as any as CustomStrategyReference).strategy).toBe('function')
        expect((elems[0].selector as CustomStrategyReference).strategyName).toBe('test')
        expect((elems[0].selector as CustomStrategyReference).strategyArguments).toHaveLength(1)
        expect((elems[0].selector as CustomStrategyReference).strategyArguments[0]).toBe('.test')
        expect(elems[0].elementId).toBe('.test-foobar')
        expect(elems[1].elementId).toBe('.test-other-foobar')
        expect(elems.foundWith).toBe('custom$$')
        expect(elems.selector).toBe('test')
        expect(elems.props).toEqual(['.test'])
    })

    it('should error if no strategy found', async () => {
        const err = await browser.custom$$('test', '.foo')
            // @ts-ignore use of sync types
            .catch((err: Error) => err) as Error

        expect(err.message).toBe('No strategy found for test')
    })

    it('should return array even if the script returns one element', async () => {
        browser.addLocatorStrategy('test', (selector: string) => (
            { 'element-6066-11e4-a52e-4f735466cecf': `${selector}-foobar` }
        ) as any)

        const elems = await browser.custom$$('test', '.test')

        expect(elems).toHaveLength(1)
        expect(elems[0].elementId).toBe('.test-foobar')
    })

    it('should return an empty array if no elements are returned from script', async () => {
        browser.addLocatorStrategy('test-no-element', () => null as any)
        const elems = await browser.custom$$('test-no-element', '.test')
        expect([...elems]).toMatchObject([])
    })
})
