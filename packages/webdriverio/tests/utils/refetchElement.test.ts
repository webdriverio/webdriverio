import path from 'node:path'
import { describe, it, beforeAll, expect, vi } from 'vitest'
// @ts-expect-error
import got from 'got'
import { remote } from '../../src/index.js'
import refetchElement from '../../src/utils/refetchElement.js'
import { waitForExist } from '../../src/commands/element/waitForExist.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../../src/commands/element/waitForExist', () => ({
    __esModule: true,
    waitForExist: vi.fn().mockImplementation(() => { return true })
}))

describe('refetchElement', () => {
    let browser: WebdriverIO.Browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            },
            waitforInterval: 20,
            waitforTimeout: 100
        })
    })

    it('should successfully refetch a non chained element', async () => {
        const elem = await browser.$('#foo')
        const refetchedElement = await refetchElement(elem, 'click')
        expect(JSON.stringify(refetchedElement)).toBe(JSON.stringify(elem))
    })

    it('should successfully refetch a chained element', async () => {
        const elem = await browser.$('#foo')
        const subElem = await elem.$('#subfoo')
        const refetchedElement = await refetchElement(subElem, 'click')
        expect(JSON.stringify(refetchedElement)).toBe(JSON.stringify(subElem))
    })

    it('should successfully refetch a deeply chained element', async () => {
        const elem = await browser.$('#foo')
        const subElem = await elem.$('#subfoo')
        const subSubElem = await subElem.$('#subsubfoo')
        const refetchedElement = await refetchElement(subSubElem, 'click')
        expect(JSON.stringify(refetchedElement)).toBe(JSON.stringify(subSubElem))
    })

    it('should not lose element index', async () => {
        const elem = await browser.$('#foo')
        const subElems = await elem.$$('#subfoo')
        const subElem1 = subElems[0]
        const subElem2 = subElems[1]
        const refetchedElement1 = await refetchElement(subElem1, '$')
        const refetchedElement2 = await refetchElement(subElem2, '$')
        expect(refetchedElement1.elementId).toEqual(subElem1.elementId)
        expect(refetchedElement2.elementId).toEqual(subElem2.elementId)
    })

    it('should successfully refetch an element that isn\'t immediately present', async () => {
        const elem = await browser.$('#foo')
        // @ts-ignore mock feature
        got.retryCnt = 0
        const notFound = await browser.$('#slowRerender')
        const refetchedElement = await refetchElement(notFound, 'click')
        expect(vi.mocked(waitForExist).mock.calls).toHaveLength(1)
        expect(refetchedElement.elementId).toBe(elem.elementId)
    })

    it('should successfully refetch an element using custom locator', async () => {
        browser.addLocatorStrategy('myLocator1', (id: string) => (
            { 'element-6066-11e4-a52e-4f735466cecf': id }
        ) as any)

        const elem = await browser.custom$('myLocator1', 'foo')
        const refetchedElement = await refetchElement(elem, '$')
        expect(elem.elementId).toEqual('foo')
        expect(refetchedElement.elementId).toEqual(elem.elementId)
    })

    it('should successfully refetch an element from a list using custom locator', async () => {
        browser.addLocatorStrategy('myLocator2', (id: string) => (
            [
                { 'element-6066-11e4-a52e-4f735466cecf': id + '0', index: 0 },
                { 'element-6066-11e4-a52e-4f735466cecf': id + '1', index: 1 }
            ]
        ) as any)

        const elems = await browser.custom$$('myLocator2', 'foo')
        const refetchedElement1 = await refetchElement(elems[0], '$')
        const refetchedElement2 = await refetchElement(elems[0], '$')
        expect(elems[0].elementId).toEqual('foo0')
        expect(elems[1].elementId).toEqual('foo1')
        expect(refetchedElement1.elementId).toEqual(elems[0].elementId)
        expect(refetchedElement2.elementId).toEqual(elems[0].elementId)
    })

    it('should successfully refetch a sub element using custom locator', async () => {
        browser.addLocatorStrategy('myLocator3', (id: string, root: any) => (
            { 'element-6066-11e4-a52e-4f735466cecf': root + id }
        ) as any)

        const elem = await browser.$('#foo')
        expect(elem.elementId).toEqual('some-elem-123')
        const subElem = await elem.custom$('myLocator3', 'bar')
        const refetchedElement = await refetchElement(subElem, '$')
        expect(subElem.elementId).toEqual('some-elem-123bar')
        expect(refetchedElement.elementId).toEqual(subElem.elementId)
    })

    it('should successfully refetch a sub element from a list using custom locator', async () => {
        browser.addLocatorStrategy('myLocator4', (id: string, root: any) => (
            [
                { 'element-6066-11e4-a52e-4f735466cecf': root + id + '0', index: 0 },
                { 'element-6066-11e4-a52e-4f735466cecf': root + id + '1', index: 1 }
            ]
        ) as any)

        const elem = await browser.$('#foo')
        expect(elem.elementId).toEqual('some-elem-123')
        const subElems = await elem.custom$$('myLocator4', 'bar')
        const refetchedElement1 = await refetchElement(subElems[0], '$')
        const refetchedElement2 = await refetchElement(subElems[1], '$')
        expect(subElems[0].elementId).toEqual('some-elem-123bar0')
        expect(subElems[1].elementId).toEqual('some-elem-123bar1')
        expect(refetchedElement1.elementId).toEqual(subElems[0].elementId)
        expect(refetchedElement2.elementId).toEqual(subElems[1].elementId)
    })
})
