import { remote } from '../../src'
import refetchElement from '../../src/utils/refetchElement'

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
        const refetchedElement = await refetchElement(elem)
        expect(JSON.stringify(refetchedElement)).toBe(JSON.stringify(elem))
    })

    it('should successfully refetch a chained element', async () => {
        const elem = await browser.$('#foo')
        const subElem = await elem.$('#subfoo')
        const refetchedElement = await refetchElement(subElem)
        expect(JSON.stringify(refetchedElement)).toBe(JSON.stringify(subElem))
    })

    it('should successfully refetch a deeply chained element', async () => {
        const elem = await browser.$('#foo')
        const subElem = await elem.$('#subfoo')
        const subSubElem = await subElem.$('#subsubfoo')
        const refetchedElement = await refetchElement(subSubElem)
        expect(JSON.stringify(refetchedElement)).toBe(JSON.stringify(subSubElem))
    })
})
