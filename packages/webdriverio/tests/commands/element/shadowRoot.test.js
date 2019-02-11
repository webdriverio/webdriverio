import { remote } from '../../../src'

fdescribe('shadowRoot', () => {
    it('should return an elements shadow root as an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const el = await browser.$('#foo')
        const subElem = await el.shadowRoot('#subfoo')
        expect(subElem.elementId).toBe('some-sub-elem-321')
    })

})
