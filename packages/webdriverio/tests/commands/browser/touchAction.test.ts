import path from 'node:path'
import { expect, describe, it, beforeEach, vi, beforeAll } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('touchAction test', () => {
    let browser: WebdriverIO.Browser
    let elem: WebdriverIO.Element

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                // @ts-ignore mock feature
                mobileMode: true
            } as any
        })
        elem = await browser.$('#foo')
    })

    describe('single touch', () => {
        it('should throw if element is not applied', async () => {
            await expect(() => browser.touchAction('press'))
                .rejects.toThrow(/Touch actions like "press" need at least some kind of position information/)
        })

        it('should allow to pass in an element object', async () => {
            await browser.touchAction({
                action: 'press',
                x: 1,
                y: 2,
                element: elem
            })
            // @ts-expect-error mock implementation
            expect(vi.mocked(fetch).mock.calls[0][0]!.pathname).toContain('/touch/perform')
            expect(vi.mocked(fetch).mock.calls[0][1]!.body).toEqual(JSON.stringify({
                actions: [
                    { action: 'press', options: {  element: 'some-elem-123', x: 1, y: 2 } }
                ]
            }))
        })

        it('should allow to press on x/y coordinates', async () => {
            await browser.touchAction({
                action: 'press',
                x: 1,
                y: 2
            })
            // @ts-expect-error mock implementation
            expect(vi.mocked(fetch).mock.calls[0][0]!.pathname).toContain('/touch/perform')
            expect(vi.mocked(fetch).mock.calls[0][1]!.body).toEqual(JSON.stringify({
                actions: [
                    { action: 'press', options: { x: 1, y: 2 } }
                ]
            }))
        })

        it('should handle multiple actions as strings properly', async () => {
            await browser.touchAction(['wait', 'release'])
            // @ts-expect-error mock implementation
            expect(vi.mocked(fetch).mock.calls[0][0]!.pathname).toContain('/touch/perform')
            expect(vi.mocked(fetch).mock.calls[0][1]!.body).toEqual(JSON.stringify({
                actions: [
                    { action: 'wait' },
                    { action: 'release' }
                ]
            }))
        })
    })

    describe('multi touch', () => {
        it('should transform to array using element as first citizen', async () => {
            await browser.touchAction([['press'], ['release']])
            // @ts-expect-error mock implementation
            expect(vi.mocked(fetch).mock.calls[0][0]!.pathname).toContain('/touch/multi/perform')
            expect(vi.mocked(fetch).mock.calls[0][1]!.body).toEqual(JSON.stringify({
                actions: [
                    [{ action: 'press' }],
                    [{ action: 'release' }]
                ]
            }))
        })

        it('should transform object into array', async () => {
            await browser.touchAction([[{
                action: 'press',
                x: 1,
                y: 2
            }], [{
                action: 'tap',
                x: 112,
                y: 245
            }]])
            expect(vi.mocked(fetch).mock.calls[0][1]!.body).toEqual(JSON.stringify({
                actions: [
                    [{ action: 'press', options: { x: 1, y: 2 } }],
                    [{ action: 'tap', options: { x: 112, y: 245 } }]
                ]
            }))
        })
    })

    describe('wrong protocol', () => {
        it('should transform object into array', async () => {
            const desktopBrowser = await remote({
                capabilities: { browserName: 'foobar' }
            })

            await expect(() => desktopBrowser.touchAction(['release']))
                .rejects.toThrow('touchAction can be used with Appium only.')
        })
    })

    beforeEach(() => {
        vi.mocked(fetch).mockClear()
    })
})
