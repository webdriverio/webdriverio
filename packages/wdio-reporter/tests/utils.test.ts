import { describe, expect, vi, it, afterAll } from 'vitest'

import supportsColor from 'supports-color'
import { sanitizeString, sanitizeCaps, pad, color, colorLines } from '../src/utils.js'

vi.mock('supports-color', () => {
    return {
        default: new Proxy({
            stdout: false
        }, {
            get: (ctx, prop) => {
                if (prop === 'stdout') {
                    return ctx.stdout
                }
                if (prop === 'set') {
                    return (val: boolean) => {
                        ctx.stdout = val
                    }
                }
            }
        })
    }
})

describe('utils', () => {
    it('sanitizeString', () => {
        expect(sanitizeString('Chrome v64 Windows XP my-awesome.app'))
            .toBe('chromev64windowsxpmy-awesome_app')
    })

    it('sanitizeCaps', () => {
        expect(sanitizeCaps()).toBe('')
        expect(sanitizeCaps({
            browserName: 'chrome',
            platform: 'Windows 10',
            version: 'latest',
            app: 'my-awesome.app'
        })).toBe('chrome.latest.windows10.my-awesome_app')
        expect(sanitizeCaps({
            browserName: 'chrome',
            platformName: 'Windows 10',
            browserVersion: 'latest'
        })).toBe('chrome.latest.windows10')
        expect(sanitizeCaps({
            deviceName: 'Android Emulator',
            platformName: 'Android',
            platformVersion: '6.4',
            app: 'my-awesome.apk'
        })).toBe('androidemulator.android.6_4.my-awesome_apk')
    })

    it('pad', () => {
        expect(pad('foobar', 10)).toBe('    foobar')
    })

    it('color', () => {
        expect(color('fast', 'foobar')).toBe('foobar')
        // @ts-ignore
        supportsColor.set(true)
        expect(color('fast', 'foobar')).toBe('\u001b[90mfoobar\u001b[0m')
    })

    it('colorLines', () => {
        // @ts-ignore
        supportsColor.set(false)
        expect(colorLines('fast', 'foo\nbar\nloo')).toBe('foo\nbar\nloo')
    })

    afterAll(() => {
        // @ts-ignore
        supportsColor.set(true)
    })
})
