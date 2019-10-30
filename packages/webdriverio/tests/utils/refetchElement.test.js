import { remote } from '../../src'
import got from 'got'
import refetchElement from '../../src/utils/refetchElement'

jest.mock('../../src/commands/element/waitForExist', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => { return true })
}))
const waitForExist = require('../../src/commands/element/waitForExist')

describe('refetchElement', () => {
    let browser

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
        const subElem = subElems[1]
        const refetchedElement = await refetchElement(subElem, '$')
        expect(refetchedElement.elementId).toEqual(subElem.elementId)
    })

    it('should successfully refetch an element that isn\'t immediately present', async () => {
        const elem = await browser.$('#foo')
        got.retryCnt = 0
        const notFound = await browser.$('#slowRerender')
        const refetchedElement = await refetchElement(notFound, 'click')
        expect(waitForExist.default.mock.calls).toHaveLength(1)
        expect(refetchedElement.elementId).toBe(elem.elementId)
    })
})
