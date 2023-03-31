import path from 'node:path'
import { describe, it, expect, beforeAll, vi, beforeEach } from 'vitest'

// @ts-expect-error
import got from 'got'
import { remote } from '../../../src/index.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('got')

describe('scroll', () => {
    let browser: WebdriverIO.Browser

    beforeEach(() => {
        vi.mocked(got).mockClear()
    })

    describe('desktop', () => {
        beforeAll(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar'
                }
            })
        })

        it('should be able to scroll', async () => {
            await browser.scroll(10, 100)

            const calls = vi.mocked(got).mock.calls
            expect(calls).toHaveLength(2)

            const [
                [performActionUrl, performActionParam],
                [releaseActionUrl, releaseActionParam]
            ] = calls as any
            expect(performActionUrl.pathname).toBe('/session/foobar-123/actions')
            expect(releaseActionUrl.pathname).toBe('/session/foobar-123/actions')
            expect(performActionParam.method).toBe('POST')
            expect(releaseActionParam.method).toBe('DELETE')
            expect(performActionParam.json).toMatchSnapshot()
        })

        it('should do nothing if no parameters or values are 0', async () => {
            await browser.scroll()
            await browser.scroll(0, 0)
            expect(vi.mocked(got).mock.calls).toHaveLength(0)
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
            // @ts-expect-error mock feature
            global.window = { scrollBy: vi.fn() }
        })

        it('should be able to scroll', async () => {
            await browser.scroll(10, 100)

            const calls = vi.mocked(got).mock.calls
            expect(calls).toHaveLength(1)

            const [
                [executeCallUrl, executeCallOptions]
            ] = calls as any
            expect(executeCallUrl.pathname).toEqual('/session/foobar-123/execute/sync')
            expect(executeCallOptions.json.script).toEqual('return ((x2, y2) => window.scrollBy(x2, y2)).apply(null, arguments)')
            expect(executeCallOptions.json.args).toHaveLength(2)
            expect(executeCallOptions.json.args[0]).toEqual(10)
            expect(executeCallOptions.json.args[1]).toEqual(100)
        })

        it('should do nothing if no parameters or values are 0', async () => {
            await browser.scroll()
            await browser.scroll(0, 0)
            expect(vi.mocked(got).mock.calls).toHaveLength(0)
        })
    })
})
