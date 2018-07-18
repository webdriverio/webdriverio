/**
 * @jest-environment jsdom
 */


import request from 'request'
import { remote } from '../../../src'

describe('newWindow', () => {
    let browser

    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should allow to create a new window handle', async () => {
        await browser.newWindow('https://webdriver.io', 'some name', 'some params')
        expect(request.mock.calls).toHaveLength(4)
        expect(request.mock.calls[1][0].body.args).toEqual(['https://webdriver.io', 'some name', 'some params'])
        expect(request.mock.calls[2][0].uri.path).toContain('/window/handles')
        expect(request.mock.calls[3][0].body.handle).toBe('window-handle-3')
    })

    it('should fail if url is invalid', async () => {
        expect.hasAssertions()

        try {
            await browser.newWindow({})
        } catch (e) {
            expect(e.message).toContain('number or type')
        }
    })

    it('should fail if browser is a mobile device', async () => {
        expect.hasAssertions()
        browser.capabilities.browserName = 'ipad'

        try {
            await browser.newWindow('https://webdriver.io', 'some name', 'some params')
        } catch (e) {
            expect(e.message).toContain('not supported on mobile')
        }
    })
})
