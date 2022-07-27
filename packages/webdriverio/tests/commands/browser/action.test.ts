import path from 'node:path'
import { describe, it, expect, beforeAll, vi, beforeEach } from 'vitest'

// @ts-expect-error
import got from 'got'
import { remote } from '../../../src/index.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('got')

describe('action command', () => {
    let browser: WebdriverIO.Browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    beforeEach(() => {
        got.mockClear()
    })

    it('should support key actions', async () => {
        await browser.action('key', { id: 'foobar' })
            .down('foo')
            .pause(100)
            .up('bar')
            .perform()

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

    it('should support pointer actions', async () => {
        await browser.action(
            'pointer',
            {
                id: 'foobar',
                parameters: { pointerType: 'pen' }
            }
        )
            .down({
                button: 1,
                width: 2,
                height: 3,
                pressure: 4,
                tangentialPressure: 5,
                tiltX: 6,
                tiltY: 7,
                twist: 8,
                altitudeAngle: 9,
                azimuthAngle: 10,
            })
            .pause(100)
            .move({
                button: 0,
                width: 1,
                height: 2,
                pressure: 3,
                tangentialPressure: 4,
                tiltX: 5,
                tiltY: 6,
                twist: 7,
                altitudeAngle: 8,
                azimuthAngle: 9,
                x: 10,
                y: 11,
                duration: 12,
                origin: 'viewport'
            })
            .up({ button: 2 })
            .cancel()
            .perform()

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

    it('should support wheel actions', async () => {
        await browser.action('wheel', { id: 'foobar' })
            .pause(100)
            .scroll({
                x: 0,
                y: 1,
                deltaX: 2,
                deltaY: 3,
                duration: 4
            })
            .perform()

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

    it('resolves not resolved wdio elements in pointer action', async () => {
        await browser.action('pointer')
            .move({ origin: browser.$('#drag') })
            .perform()
        const calls = vi.mocked(got).mock.calls
        const [,, [, performActionParam]] = calls as any
        expect(performActionParam.json).toMatchSnapshot()
    })

    it('resolves not resolved wdio elements in wheel action', async () => {
        await browser.action('wheel')
            .scroll({ origin: browser.$('#drag') })
            .perform()
        const calls = vi.mocked(got).mock.calls
        const [,, [, performActionParam]] = calls as any
        expect(performActionParam.json).toMatchSnapshot()
    })
})
