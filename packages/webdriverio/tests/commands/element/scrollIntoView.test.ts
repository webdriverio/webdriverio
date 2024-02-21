import path from 'node:path'
import { expect, describe, it, vi, beforeAll, beforeEach } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('scrollIntoView test', () => {
    let browser: WebdriverIO.Browser
    let elem: WebdriverIO.Element

    beforeEach(() => {
        vi.mocked(fetch).mockClear()
    })

    describe('desktop', () => {
        beforeAll(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar',
                },
            })
            elem = await browser.$('#foo')
            vi.spyOn(browser, 'getWindowSize').mockResolvedValue({ height: 800, width: 600 })
            vi.spyOn(browser, 'getElementRect').mockImplementation(() =>
                elem.getElementRect(elem.elementId).catch(() =>
                    // there is a test forcing `elementId` to be invalid to check the fallback to the web API
                    ({ x: 15, y: 20, height: 30, width: 50 })
                )
            )
        })

        it('scrolls by default the element to the top', async () => {
            await elem.scrollIntoView()
            const optionsVoid = vi.mocked(fetch).mock.calls.slice(-2, -1)[0][1] as any
            expect(JSON.parse(optionsVoid.body)).toMatchSnapshot()
        })

        it('scrolls element when using boolean scroll options', async () => {
            await elem.scrollIntoView(true)
            const optionsTrue = vi.mocked(fetch).mock.calls.slice(-2, -1)[0][1] as any
            expect(JSON.parse(optionsTrue.body)).toMatchSnapshot()
            vi.mocked(fetch).mockClear()
            await elem.scrollIntoView(false)
            const optionsFalse = vi.mocked(fetch).mock.calls.slice(-2, -1)[0][1] as any
            expect(JSON.parse(optionsFalse.body)).toMatchSnapshot()
        })

        it('scrolls element using scroll into view options', async () => {
            await elem.scrollIntoView({ block: 'center', inline: 'center' })
            const optionsCenter = vi.mocked(fetch).mock.calls.slice(-2, -1)[0][1] as any
            expect(JSON.parse(optionsCenter.body)).toMatchSnapshot()
        })

        it('falls back using Web API if scroll action fails', async () => {
            // @ts-expect-error mock feature
            vi.mocked(fetch).customResponseFor(/\/actions/, { error: 'invalid parameter' })
            // @ts-expect-error mock feature
            elem.elementId = { scrollIntoView: 'mockFunction' }
            await elem.scrollIntoView({})
            // @ts-expect-error mock implementation
            expect(vi.mocked(fetch).mock.calls.pop()![0]!.href.endsWith('/execute/sync'))
                .toBe(true)
        })

        it('rounds float delta values', async () => {
            vi.spyOn(browser, 'getWindowSize').mockResolvedValue({ height: 800.123, width: 600.321 })
            vi.spyOn(browser, 'getElementRect').mockResolvedValue(
                ({ x: 15.34, y: 20.23, height: 30.2344, width: 50.543 }))
            await elem.scrollIntoView({ block: 'center', inline: 'center' })
            const optionsCenter = vi.mocked(fetch).mock.calls.slice(-2, -1)[0][1] as any
            expect(JSON.parse(optionsCenter.body).actions[0].actions[0].deltaX).toBe(0)
            expect(JSON.parse(optionsCenter.body).actions[0].actions[0].deltaY).toBe(0)
            expect(JSON.parse(optionsCenter.body).actions[0].actions[0].y).toBe(-385)
        })

    })

    describe('mobile', () => {
        beforeAll(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar',
                    mobileMode: true
                } as any
            })
            elem = await browser.$('#foo')
            // @ts-expect-error mock feature
            elem.elementId = { scrollIntoView: 'mockFunction'  }
        })

        beforeEach(() => {
            vi.mocked(fetch).mockClear()
        })

        it('scrolls by default the element to the top', async () => {
            await elem.scrollIntoView()
            const { calls } = vi.mocked(fetch).mock
            expect(calls).toHaveLength(1)
            const [[executeCallUrl, executeCallOptions]] = calls as any
            expect(executeCallUrl.pathname).toEqual('/session/foobar-123/execute/sync')
            expect(JSON.parse(executeCallOptions.body).script).toEqual('return ((elem, options2) => elem.scrollIntoView(options2)).apply(null, arguments)')
            expect(JSON.parse(executeCallOptions.body).args).toHaveLength(2)
            expect(JSON.parse(executeCallOptions.body).args[1]).toEqual({ block: 'start', inline: 'nearest' })
        })

        it('scrolls element when using boolean scroll options', async () => {
            await elem.scrollIntoView(true)
            const { calls } = vi.mocked(fetch).mock
            expect(calls).toHaveLength(1)
            const [[executeCallUrl, executeCallOptions]] = calls as any
            expect(executeCallUrl.pathname).toEqual('/session/foobar-123/execute/sync')
            expect(JSON.parse(executeCallOptions.body).script).toEqual('return ((elem, options2) => elem.scrollIntoView(options2)).apply(null, arguments)')
            expect(JSON.parse(executeCallOptions.body).args).toHaveLength(2)
            expect(JSON.parse(executeCallOptions.body).args[1]).toEqual(true)
        })

        it('scrolls element using scroll into view options', async () => {
            await elem.scrollIntoView({ block: 'end', inline: 'center' })
            const { calls } = vi.mocked(fetch).mock
            expect(calls).toHaveLength(1)
            const [[executeCallUrl, executeCallOptions]] = calls as any
            expect(executeCallUrl.pathname).toEqual('/session/foobar-123/execute/sync')
            expect(JSON.parse(executeCallOptions.body).script).toEqual('return ((elem, options2) => elem.scrollIntoView(options2)).apply(null, arguments)')
            expect(JSON.parse(executeCallOptions.body).args).toHaveLength(2)
            expect(JSON.parse(executeCallOptions.body).args[1]).toEqual({ block: 'end', inline: 'center' })
        })
    })
})
