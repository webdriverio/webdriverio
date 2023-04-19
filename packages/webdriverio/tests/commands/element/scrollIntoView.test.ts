import path from 'node:path'
import { expect, describe, it, vi, beforeAll, beforeEach } from 'vitest'

// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src/index.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('scrollIntoView test', () => {
    let browser: WebdriverIO.Browser
    let elem: WebdriverIO.Element

    beforeEach(() => {
        vi.mocked(got).mockClear()
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
            const optionsVoid = vi.mocked(got).mock.calls.slice(-2, -1)[0][1] as any
            expect(optionsVoid.json).toMatchSnapshot()
        })

        it('scrolls element when using boolean scroll options', async () => {
            await elem.scrollIntoView(true)
            const optionsTrue = vi.mocked(got).mock.calls.slice(-2, -1)[0][1] as any
            expect(optionsTrue.json).toMatchSnapshot()
            vi.mocked(got).mockClear()
            await elem.scrollIntoView(false)
            const optionsFalse = vi.mocked(got).mock.calls.slice(-2, -1)[0][1] as any
            expect(optionsFalse.json).toMatchSnapshot()
        })

        it('scrolls element using scroll into view options', async () => {
            await elem.scrollIntoView({ block: 'center', inline: 'center' })
            const optionsCenter = vi.mocked(got).mock.calls.slice(-2, -1)[0][1] as any
            expect(optionsCenter.json).toMatchSnapshot()
        })

        it('falls back using Web API if scroll action fails', async () => {
            // @ts-expect-error mock feature
            got.customResponseFor(/\/actions/, { error: 'invalid parameter' })
            // @ts-expect-error mock feature
            elem.elementId = { scrollIntoView: vi.fn() }
            await elem.scrollIntoView({})
            expect(vi.mocked(got).mock.calls.pop()![0]!.href.endsWith('/execute/sync'))
                .toBe(true)
        })

        it('rounds float delta values', async () => {
            vi.spyOn(browser, 'getWindowSize').mockResolvedValue({ height: 800.123, width: 600.321 })
            vi.spyOn(browser, 'getElementRect').mockResolvedValue(
                ({ x: 15.34, y: 20.23, height: 30.2344, width: 50.543 }))
            await elem.scrollIntoView({ block: 'center', inline: 'center' })
            const optionsCenter = vi.mocked(got).mock.calls.slice(-2, -1)[0][1] as any
            expect(optionsCenter.json.actions[0].actions[0].deltaX).toBe(-275)
            expect(optionsCenter.json.actions[0].actions[0].deltaY).toBe(415)
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
            elem.elementId = { scrollIntoView: vi.fn() }
        })

        beforeEach(() => {
            vi.mocked(got).mockClear()
        })

        it('scrolls by default the element to the top', async () => {
            await elem.scrollIntoView()
            const { calls } = vi.mocked(got).mock
            expect(calls).toHaveLength(1)
            const [
                [executeCallUrl, executeCallOptions]
            ] = calls as any
            expect(executeCallUrl.pathname).toEqual('/session/foobar-123/execute/sync')
            expect(executeCallOptions.json.script).toEqual('return ((elem, options2) => elem.scrollIntoView(options2)).apply(null, arguments)')
            expect(executeCallOptions.json.args).toHaveLength(2)
            expect(executeCallOptions.json.args[1]).toEqual({ block: 'start', inline: 'nearest' })
        })

        it('scrolls element when using boolean scroll options', async () => {
            await elem.scrollIntoView(true)
            const { calls } = vi.mocked(got).mock
            expect(calls).toHaveLength(1)
            const [
                [executeCallUrl, executeCallOptions]
            ] = calls as any
            expect(executeCallUrl.pathname).toEqual('/session/foobar-123/execute/sync')
            expect(executeCallOptions.json.script).toEqual('return ((elem, options2) => elem.scrollIntoView(options2)).apply(null, arguments)')
            expect(executeCallOptions.json.args).toHaveLength(2)
            expect(executeCallOptions.json.args[1]).toEqual(true)
        })

        it('scrolls element using scroll into view options', async () => {
            await elem.scrollIntoView({ block: 'end', inline: 'center' })
            const { calls } = vi.mocked(got).mock
            expect(calls).toHaveLength(1)
            const [
                [executeCallUrl, executeCallOptions]
            ] = calls as any
            expect(executeCallUrl.pathname).toEqual('/session/foobar-123/execute/sync')
            expect(executeCallOptions.json.script).toEqual('return ((elem, options2) => elem.scrollIntoView(options2)).apply(null, arguments)')
            expect(executeCallOptions.json.args).toHaveLength(2)
            expect(executeCallOptions.json.args[1]).toEqual({ block: 'end', inline: 'center' })
        })
    })
})
