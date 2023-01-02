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
        browser.addLocatorStrategy('test', (selector: string, root: HTMLElement) => [
            { 'element-6066-11e4-a52e-4f735466cecf': `${selector}-${root}` },
            { 'element-6066-11e4-a52e-4f735466cecf': `${selector}-other-${root}` }
        ] as any as HTMLElement[])

        const elem = await browser.$('#foo')
        const elems = await elem.custom$$('test', '.test')

        expect(elems).toHaveLength(2)
        expect(typeof elems.selector).toBe('string')
        expect(typeof elems[0].selector).toBe('object')
        expect(typeof (elems[0].selector as CustomStrategyReference).strategy).toBe('function')
        expect((elems[0].selector as CustomStrategyReference).strategyName).toBe('test')
        expect((elems[0].selector as CustomStrategyReference).strategyArguments).toHaveLength(2)
        expect((elems[0].selector as CustomStrategyReference).strategyArguments[0]).toBe('.test')
        expect((elems[0].selector as CustomStrategyReference).strategyArguments[1]).toBe(elem)
        expect(elems[0].elementId).toBe('.test-some-elem-123')
        expect(elems[1].elementId).toBe('.test-other-some-elem-123')
        expect(elems.foundWith).toBe('custom$$')
        expect(elems.selector).toBe('test')
        expect(elems.props).toEqual(['.test'])
    })

    it('should error if no strategy found', async () => {
        const elem = await browser.$('#foo')
        const err = await elem.custom$$('test', '.foo')
            // @ts-ignore uses sync commands
            .catch(err => err)
        expect(err.message).toBe('No strategy found for test')
    })

    it('should throw an error if root element does not exist', async () => {
        // @ts-ignore test invalid feature
        browser.addLocatorStrategy('test', () => null)

        const elem = await browser.$('#nonexisting')
        const error = await elem.custom$$('test', '.test')
            // @ts-ignore uses sync commands
            .catch((err) => err)
        expect(error.message).toContain('because element wasn\'t found')
    })

    it('should return array even if the script returns one element', async () => {
        // @ts-ignore mock feature
        browser.addLocatorStrategy('test', (selector: string, parent: string) => (
            { 'element-6066-11e4-a52e-4f735466cecf': `${selector}-${parent}` }
        ))

        const elem = await browser.$('#foo')
        const elems = await elem.custom$$('test', '.test')

        expect(elems).toHaveLength(1)
        expect(elems[0].elementId).toBe('.test-some-elem-123')
    })

    it('should return an empty array if no elements are returned from script', async () => {
        // @ts-ignore test invalid feature
        browser.addLocatorStrategy('test-no-element', () => null)

        const elem = await browser.$('#foo')
        const elems = await elem.custom$$('test-no-element', '.test')

        expect([...elems]).toMatchObject([])
    })
})
