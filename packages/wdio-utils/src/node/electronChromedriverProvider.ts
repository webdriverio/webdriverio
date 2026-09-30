import { Browser, type BrowserProvider, type DownloadOptions } from '@puppeteer/browsers'
import fullChromiumVersions from 'electron-to-chromium/full-chromium-versions.js'

/** Finds an Electron release with the same Chromium major, since Chromedriver only checks the major */
export function getElectronVersionForChromium (chromiumVersion: string) {
    const major = chromiumVersion.split('.')[0]
    return Object.entries(fullChromiumVersions)
        .filter(([chromium]) => chromium.split('.')[0] === major)
        .flatMap(([, electron]) => electron)
        .at(-1)
}

/**
 * Downloads the Chromedriver bundled with an Electron release, whose version is the build id.
 */
export class ElectronChromedriverProvider implements BrowserProvider {
    supports (options: DownloadOptions) {
        return options.browser === Browser.CHROMEDRIVER
    }

    getDownloadUrl ({ buildId }: DownloadOptions) {
        const repo = buildId.includes('-nightly.') ? 'nightlies' : 'electron'
        // Electron names its assets after Node's platform and arch, except 32-bit ARM
        const arch = process.arch === 'arm' ? 'armv7l' : process.arch
        return new URL(`https://github.com/electron/${repo}/releases/download/v${buildId}/chromedriver-v${buildId}-${process.platform}-${arch}.zip`)
    }

    getExecutablePath () {
        return process.platform === 'win32' ? 'chromedriver.exe' : 'chromedriver'
    }

    getName () {
        return 'electron'
    }
}
