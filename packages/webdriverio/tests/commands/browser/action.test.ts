import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, beforeAll, vi, beforeEach } from 'vitest'

// @ts-expect-error
import got from 'got'
import { remote, Key } from '../../../src/index.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('got')
vi.mock('node:os')

vi.mocked(os.type).mockReturnValue('Darwin')

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
        vi.mocked(got).mockClear()
    })

    it('should support key actions', async () => {
        await browser.action('key', { id: 'foobar' })
            .down('f')
            .pause(100)
            .up('b')
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

    it('fails if user triggers more than one character', async () => {
        await expect(async () => browser.action('key').down('foo').perform())
            .rejects
            .toMatch(/more than one/)
    })

    it('should trigger command key when Key.Ctrl is used', async () => {
        vi.mocked(os.type).mockReturnValue('Darwin')
        await browser.action('key', { id: 'foobar' })
            .down(Key.Ctrl).perform()
        const calls = vi.mocked(got).mock.calls
        const [[, performActionParam]] = calls as any
        expect(performActionParam.json.actions[0].actions[0].value).toBe(Key.Command)
    })

    it('should trigger control key when Key.Ctrl is used because we use Windows', async () => {
        vi.mocked(os.type).mockReturnValue('Windows')
        await browser.action('key', { id: 'foobar' })
            .down(Key.Ctrl).perform()
        const calls = vi.mocked(got).mock.calls
        const [[, performActionParam]] = calls as any
        expect(performActionParam.json.actions[0].actions[0].value).toBe(Key.Control)
    })

    it('should trigger command key when Key.Ctrl is used because platformName is mac', async () => {
        vi.mocked(os.type).mockReturnValue('Windows')
        // @ts-ignore
        browser.capabilities.platformName = 'Mac OS'
        await browser.action('key', { id: 'foobar' })
            .down(Key.Ctrl).perform()
        const calls = vi.mocked(got).mock.calls
        const [[, performActionParam]] = calls as any
        expect(performActionParam.json.actions[0].actions[0].value).toBe(Key.Command)
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
            .down('right')
            .move(100, 200)
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
            .up('middle')
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
