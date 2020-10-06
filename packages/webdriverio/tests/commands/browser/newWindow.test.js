/**
 * @jest-environment jsdom
 */

import got from 'got'
import { remote } from '../../../src'

describe('newWindow', () => {
    beforeEach(() => {
        global.window.open = jest.fn()
    })

    afterEach(() => {
        got.mockClear()
        global.window.open.mockRestore()
    })

    it('should allow to create a new window handle', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        await browser.newWindow('https://webdriver.io', {
            windowName: 'some name',
            windowFeatures: 'some params'
        })
        expect(got.mock.calls).toHaveLength(4)
        expect(got.mock.calls[1][1].json.args)
            .toEqual(['https://webdriver.io', 'some name', 'some params'])
        expect(got.mock.calls[2][0].pathname)
            .toContain('/window/handles')
        expect(got.mock.calls[3][1].json.handle)
            .toBe('window-handle-3')
    })

    it('should apply default args', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        await browser.newWindow('https://webdriver.io')
        expect(got.mock.calls).toHaveLength(4)
        expect(got.mock.calls[1][1].json.args)
            .toEqual(['https://webdriver.io', 'New Window', ''])
    })

    it('should fail if url is invalid', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        expect.hasAssertions()

        try {
            await browser.newWindow({})
        } catch (e) {
            expect(e.message).toContain('number or type')
        }
    })

    it('should fail if browser is a mobile device', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'ipad',
                mobileMode: true
            }
        })

        const error = await browser.newWindow('https://webdriver.io', 'some name', 'some params')
            .catch((err) => err)
        expect(error.message).toContain('not supported on mobile')
    })
})
