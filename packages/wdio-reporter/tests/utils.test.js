import { sanitizeString, sanitizeCaps } from '../src/utils'

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
})
