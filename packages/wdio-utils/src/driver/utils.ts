import os from 'node:os'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import cp from 'node:child_process'

import got from 'got'
import decamelize from 'decamelize'
import logger from '@wdio/logger'
import {
    install, canDownload, resolveBuildId, detectBrowserPlatform, Browser, ChromeReleaseChannel,
    computeExecutablePath, type InstallOptions
} from '@puppeteer/browsers'
import { download as downloadGeckodriver } from 'geckodriver'
import { download as downloadEdgedriver } from 'edgedriver'
import { locateChrome, locateFirefox } from 'locate-app'
import type { EdgedriverParameters } from 'edgedriver'
import type { Options, Capabilities } from '@wdio/types'

import { DEFAULT_HOSTNAME, DEFAULT_PROTOCOL, DEFAULT_PATH, SUPPORTED_BROWSERNAMES } from '../constants.js'

const log = logger('webdriver')
const EXCLUDED_PARAMS = ['version', 'help']

export function parseParams(params: EdgedriverParameters) {
    return Object.entries(params)
        .filter(([key,]) => !EXCLUDED_PARAMS.includes(key))
        .map(([key, val]) => {
            if (typeof val === 'boolean' && !val) {
                return ''
            }
            const vals = Array.isArray(val) ? val : [val]
            return vals.map((v) => `--${decamelize(key, { separator: '-' })}${typeof v === 'boolean' ? '' : `=${v}`}`)
        })
        .flat()
        .filter(Boolean)
}

export function getBuildIdByChromePath(chromePath?: string) {
    if (!chromePath) {
        return
    }

    if (os.platform() === 'win32') {
        const versionPath = path.dirname(chromePath)
        const contents = fs.readdirSync(versionPath)
        const versions = contents.filter(a => /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/g.test(a))

        // returning oldest in case there is an updated version and chrome still hasn't relaunched
        const oldest = versions.sort((a: string, b: string) => a > b ? -1 : 1)[0]
        return oldest
    }

    const versionString = cp.execSync(`"${chromePath}" --version`).toString()
    return versionString.trim().split(' ').pop()?.trim()
}

export async function getBuildIdByFirefoxPath(firefoxPath?: string) {
    if (!firefoxPath) {
        return
    }

    if (os.platform() === 'win32') {
        const appPath = path.dirname(firefoxPath)
        const contents = (await fsp.readFile(path.join(appPath, 'application.ini'))).toString('utf-8')
        return contents
            .split('\n')
            .filter((line) => line.startsWith('Version='))
            .map((line) => line.replace('Version=', '').replace(/\r/, ''))
            .pop()
    }

    const versionString = cp.execSync(`"${firefoxPath}" --version`).toString()
    return versionString.split(' ').pop()?.trim()
}

let lastTimeCalled = Date.now()
export const downloadProgressCallback = (artifact: string, downloadedBytes: number, totalBytes: number) => {
    if (Date.now() - lastTimeCalled < 1000) {
        return
    }
    const percentage = ((downloadedBytes / totalBytes) * 100).toFixed(2)
    log.info(`Downloading ${artifact} ${percentage}%`)
    lastTimeCalled = Date.now()
}

export async function setupPuppeteerBrowser(cacheDir: string, caps: Capabilities.Capabilities) {
    caps.browserName = caps.browserName?.toLowerCase()

    const browserName = caps.browserName === Browser.FIREFOX ? Browser.FIREFOX : Browser.CHROME
    const exist = await fsp.access(cacheDir).then(() => true, () => false)
    if (!exist) {
        await fsp.mkdir(cacheDir, { recursive: true })
    }

    /**
     * don't set up Chrome if a binary was defined in caps
     */
    const chromeOptions = caps['goog:chromeOptions'] || {}
    if (typeof chromeOptions.binary === 'string') {
        return {
            executablePath: chromeOptions.binary,
            browserVersion: getBuildIdByPath(chromeOptions.binary)
        }
    }

    const platform = detectBrowserPlatform()
    if (!platform) {
        throw new Error('The current platform is not supported.')
    }

    if (!caps.browserVersion) {
        const executablePath = browserName === Browser.CHROME
            ? await locateChrome().catch(() => undefined)
            : await locateFirefox().catch(() => undefined)
        const tag = browserName === Browser.CHROME
            ? getBuildIdByChromePath(executablePath)
            : await getBuildIdByFirefoxPath(executablePath)
        /**
         * verify that we have a valid Chrome browser installed
         */
        if (tag) {
            return {
                executablePath,
                browserVersion: await resolveBuildId(browserName, platform, tag)
            }
        }
    }

    /**
     * otherwise download provided Chrome browser version or "stable"
     */
    const tag = caps.browserVersion || ChromeReleaseChannel.STABLE
    const buildId = await resolveBuildId(browserName, platform, tag)
    const installOptions: InstallOptions & { unpack?: true } = {
        unpack: true,
        cacheDir,
        platform,
        buildId,
        browser: browserName,
        downloadProgressCallback: (downloadedBytes, totalBytes) => downloadProgressCallback(browserName, downloadedBytes, totalBytes)
    }
    const isCombinationAvailable = await canDownload(installOptions)
    if (!isCombinationAvailable) {
        throw new Error(`Couldn't find a matching Chrome browser for tag "${buildId}" on platform "${platform}"`)
    }

    log.info(`Setting up ${browserName} v${buildId}`)
    await install(installOptions)
    const executablePath = computeExecutablePath(installOptions)
    return { executablePath, browserVersion: buildId }
}

function getDriverOptions (caps: Capabilities.Capabilities) {
    return (
        caps['wdio:chromedriverOptions'] ||
        caps['wdio:geckodriverOptions'] ||
        caps['wdio:edgedriverOptions'] ||
        // Safaridriver does not have any options as it already
        // is installed on macOS
        {}
    )
}

export function getCacheDir (options: Pick<Options.WebDriver, 'cacheDir'>, caps: Capabilities.Capabilities) {
    const driverOptions = getDriverOptions(caps)
    return driverOptions.cacheDir || options.cacheDir || os.tmpdir()
}

export async function setupChromedriver (cacheDir: string, driverVersion?: string) {
    const platform = detectBrowserPlatform()
    if (!platform) {
        throw new Error('The current platform is not supported.')
    }

    const version = driverVersion || getBuildIdByChromePath(await locateChrome()) || ChromeReleaseChannel.STABLE
    const buildId = await resolveBuildId(Browser.CHROMEDRIVER, platform, version)
    let executablePath = computeExecutablePath({
        browser: Browser.CHROMEDRIVER,
        buildId,
        platform,
        cacheDir
    })
    let loggedBuildId = buildId
    const hasChromedriverInstalled = await fsp.access(executablePath).then(() => true, () => false)
    if (!hasChromedriverInstalled) {
        log.info(`Downloading Chromedriver v${buildId}`)
        const chromedriverInstallOpts: InstallOptions & {unpack?: true} = {
            cacheDir,
            buildId,
            platform,
            browser: Browser.CHROMEDRIVER,
            unpack: true,
            downloadProgressCallback: (downloadedBytes, totalBytes) => downloadProgressCallback('Chromedriver', downloadedBytes, totalBytes)
        }

        try {
            await install({ ...chromedriverInstallOpts, buildId })
        } catch (err) {
            /**
             * in case we detect a Chrome browser installed for which there is no Chromedriver available
             * we are falling back to the latest known good version
             */
            log.warn(`Couldn't download Chromedriver v${buildId}: ${(err as Error).message}, trying to find known good version...`)
            let knownGoodVersion: string
            if (buildId.includes('.')) {
                const majorVersion = buildId.split('.')[0]
                const knownGoodVersions: any = await got('https://googlechromelabs.github.io/chrome-for-testing/known-good-versions.json').json()
                const versionMatch = knownGoodVersions.versions.filter(({ version }: { version: string }) => version.startsWith(majorVersion)).pop()
                if (!versionMatch) {
                    throw new Error(`Couldn't find known good version for Chromedriver v${majorVersion}`)
                }
                knownGoodVersion = versionMatch.version
            } else {
                knownGoodVersion = await resolveBuildId(Browser.CHROMEDRIVER, platform, buildId)
            }

            loggedBuildId = knownGoodVersion
            await install({ ...chromedriverInstallOpts, buildId: loggedBuildId })
            executablePath = computeExecutablePath({
                browser: Browser.CHROMEDRIVER,
                buildId: loggedBuildId,
                platform,
                cacheDir
            })
        }
    } else {
        log.info(`Using Chromedriver v${buildId} from cache directory ${cacheDir}`)
    }

    return { executablePath }
}

export function setupGeckodriver (cacheDir: string, driverVersion?: string) {
    return downloadGeckodriver(driverVersion, cacheDir)
}

export function setupEdgedriver (cacheDir: string, driverVersion?: string) {
    return downloadEdgedriver(driverVersion, cacheDir)
}

/**
 * helper method to determine if we need to setup a browser driver
 * which is:
 *   - whenever the user has set connection options that differ
 *     from the default, or a port is set
 *   - whenever the user defines `user` and `key` which later will
 *     update the connection options
 */
export function definesRemoteDriver(options: Pick<Options.WebDriver, 'user' | 'key' | 'protocol' | 'hostname' | 'port' | 'path'>) {
    return Boolean(
        (options.protocol && options.protocol !== DEFAULT_PROTOCOL) ||
        (options.hostname && options.hostname !== DEFAULT_HOSTNAME) ||
        Boolean(options.port) ||
        (options.path && options.path !== DEFAULT_PATH) ||
        Boolean(options.user && options.key)
    )
}

export function isChrome (browserName?: string) {
    return Boolean(browserName && SUPPORTED_BROWSERNAMES.chrome.includes(browserName.toLowerCase()))
}
export function isSafari (browserName?: string) {
    return Boolean(browserName && SUPPORTED_BROWSERNAMES.safari.includes(browserName.toLowerCase()))
}
export function isFirefox (browserName?: string) {
    return Boolean(browserName && SUPPORTED_BROWSERNAMES.firefox.includes(browserName.toLowerCase()))
}
export function isEdge (browserName?: string) {
    return Boolean(browserName && SUPPORTED_BROWSERNAMES.edge.includes(browserName.toLowerCase()))
}
