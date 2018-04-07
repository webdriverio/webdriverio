import request from 'request'
import { remote } from '../../../src'

describe('selectByVisibleText test', () => {
    let browser
    let elem

    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        elem = await browser.$('some-elem-123')
    })

    afterEach(() => {
        request.mockClear()
    })

    it('should select value by visible text', async () => {
        await elem.selectByVisibleText(' someValue1 ')

        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/element')
        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/element')
        /* eslint-disable-next-line no-useless-escape */
        expect(request.mock.calls[2][0].body.value).toBe(`./option[normalize-space(translate(., ' ', '')) = \"someValue1\"]|./optgroup/option[normalize-space(translate(., ' ', '')) = \"someValue1\"]`)
        expect(request.mock.calls[3][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-sub-elem-321/click')
    })

    it('should select value by visible text with quotes', async () => {
        await elem.selectByVisibleText(' "someValue1"" ')

        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/element')
        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/element')
        /* eslint-disable no-useless-escape */
        expect(request.mock.calls[2][0].body.value).toBe(`./option[normalize-space(translate(., ' ', '')) = concat(\"\", '\"', \"someValue1\", '\"', \"\", '\"', \"\")]|./optgroup/option[normalize-space(translate(., ' ', '')) = concat(\"\", '\"', \"someValue1\", '\"', \"\", '\"', \"\")]`)
        /*eslint-enable */
        expect(request.mock.calls[3][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-sub-elem-321/click')
    })
})
