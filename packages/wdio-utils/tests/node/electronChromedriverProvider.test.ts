import { describe, it, expect, vi, afterEach } from 'vitest'
import { Browser, BrowserPlatform } from '@puppeteer/browsers'

import { ElectronChromedriverProvider, getElectronVersionForChromium } from '../../src/node/electronChromedriverProvider.js'

vi.mock('electron-to-chromium/full-chromium-versions.js', () => ({
    default: {
        '130.0.6723.118': ['33.2.0'],
        '130.0.6723.137': ['33.2.1'],
        '131.0.6778.0': ['34.0.0-alpha.1', '34.0.0-alpha.2']
    }
}))

describe('getElectronVersionForChromium', () => {
    it('returns the last Electron release with the same Chromium major', () => {
        expect(getElectronVersionForChromium('130.0.6900.1')).toBe('33.2.1')
        expect(getElectronVersionForChromium('131.0.6778.85')).toBe('34.0.0-alpha.2')
    })

    it('returns undefined when no Electron release ships the major', () => {
        expect(getElectronVersionForChromium('129.0.6668.1')).toBeUndefined()
    })
})

describe('ElectronChromedriverProvider', () => {
    const provider = new ElectronChromedriverProvider()
    const { platform: originalPlatform, arch: originalArch } = process

    afterEach(() => {
        Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true })
        Object.defineProperty(process, 'arch', { value: originalArch, configurable: true })
    })

    it('supports Chromedriver only', () => {
        expect(provider.supports({ browser: Browser.CHROMEDRIVER, buildId: '33.2.1', platform: BrowserPlatform.LINUX_ARM })).toBe(true)
        expect(provider.supports({ browser: Browser.CHROME, buildId: '33.2.1', platform: BrowserPlatform.LINUX_ARM })).toBe(false)
    })

    it.each([
        ['linux', 'arm64', 'linux-arm64'],
        ['linux', 'arm', 'linux-armv7l']
    ])('downloads the Chromedriver for %s on %s from the Electron release', (platform, arch, electronPlatform) => {
        Object.defineProperty(process, 'platform', { value: platform, configurable: true })
        Object.defineProperty(process, 'arch', { value: arch, configurable: true })
        expect(provider.getDownloadUrl({ browser: Browser.CHROMEDRIVER, buildId: '34.0.0-beta.9', platform: BrowserPlatform.LINUX }).toString()).toBe(
            `https://github.com/electron/electron/releases/download/v34.0.0-beta.9/chromedriver-v34.0.0-beta.9-${electronPlatform}.zip`
        )
    })

    it('downloads nightly builds from electron/nightlies', () => {
        Object.defineProperty(process, 'platform', { value: 'linux', configurable: true })
        Object.defineProperty(process, 'arch', { value: 'arm64', configurable: true })
        expect(provider.getDownloadUrl({ browser: Browser.CHROMEDRIVER, buildId: '36.0.0-nightly.20250303', platform: BrowserPlatform.LINUX_ARM }).toString()).toBe(
            'https://github.com/electron/nightlies/releases/download/v36.0.0-nightly.20250303/chromedriver-v36.0.0-nightly.20250303-linux-arm64.zip'
        )
    })

    it('finds the executable at the root of the archive', () => {
        Object.defineProperty(process, 'platform', { value: 'linux', configurable: true })
        expect(provider.getExecutablePath()).toBe('chromedriver')
        Object.defineProperty(process, 'platform', { value: 'win32', configurable: true })
        expect(provider.getExecutablePath()).toBe('chromedriver.exe')
    })
})
