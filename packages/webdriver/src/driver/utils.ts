import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import cp from 'node:child_process'

import decamelize from 'decamelize'
import logger from '@wdio/logger'
import { getChromePath } from 'chrome-launcher'
import {
    install, canDownload, resolveBuildId, detectBrowserPlatform, Browser, ChromeReleaseChannel,
    computeExecutablePath, type InstallOptions, type BrowserPlatform
} from '@puppeteer/browsers'
import type { EdgedriverParameters } from 'edgedriver'
import type { Capabilities, Options } from '@wdio/types'

import { DEFAULTS } from '../constants.js'
import fsp from 'node:fs/promises'

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

export function getLocalChromePath() {
    try {
        const chromePath = getChromePath()
        return chromePath
    } catch (err: unknown) {
        return
    }
}

export function getBuildIdByPath(chromePath?: string) {
    if (!chromePath) {
        return
    } else if (os.platform() === 'win32') {
        const versionPath = path.dirname(chromePath)
        const contents = fs.readdirSync(versionPath)
        const versions = contents.filter(a => /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/g.test(a))

        // returning oldest in case there is an updated version and chrome still hasn't relaunched
        const oldest = versions.sort((a: string, b: string) => a > b ? -1 : 1)[0]
        return oldest
    }

    const versionString = cp.execSync(`"${chromePath}" --version`).toString()
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

export async function setupChrome(caps: Capabilities.Capabilities, cacheDir: string) {
    const platform = detectBrowserPlatform()
    if (!platform) {
        throw new Error('The current platform is not supported.')
    }

    if (!caps.browserVersion) {
        const executablePath = getLocalChromePath()!
        const tag = getBuildIdByPath(executablePath)

        /**
         * verify that we have a valid Chrome browser installed
         */
        if (tag) {
            return {
                platform,
                executablePath,
                buildId: await resolveBuildId(Browser.CHROME, platform, tag)
            }
        }
    }

    /**
     * otherwise download provided Chrome browser version or "stable"
     */
    const tag = caps.browserVersion || ChromeReleaseChannel.STABLE
    const buildId = await resolveBuildId(Browser.CHROME, platform, tag)
    const installOptions: InstallOptions & { unpack?: true } = {
        unpack: true,
        cacheDir,
        platform,
        buildId,
        browser: Browser.CHROME,
        downloadProgressCallback: (downloadedBytes, totalBytes) => downloadProgressCallback('Chrome', downloadedBytes, totalBytes)
    }
    const isCombinationAvailable = await canDownload(installOptions)
    if (!isCombinationAvailable) {
        throw new Error(`Couldn't find a matching Chrome browser for tag "${buildId}" on platform "${platform}"`)
    }

    log.info(`Setting up Chrome v${buildId}`)
    await install(installOptions)
    const executablePath = computeExecutablePath(installOptions)
    return { executablePath, buildId, platform }
}

export async function setupChromedriver(chromedriverOptions: InstallOptions, cacheDir: string, platform: BrowserPlatform, buildId: string){
    let chromedriverBinaryPath = computeExecutablePath({
        browser: Browser.CHROMEDRIVER,
        buildId,
        cacheDir
    })
    async function hasChromedriverInstalled(chromedriverBinaryPath: string) {
        return await fsp.access(chromedriverBinaryPath).then(() => true, () => false)
    }
    // Check if specified Chromedriver version is installed
    const installOptions: InstallOptions & { unpack?: true } = {
        ...chromedriverOptions,
        cacheDir,
        platform,
        buildId,
        browser: Browser.CHROMEDRIVER,
        unpack: true,
        downloadProgressCallback: (downloadedBytes: number, totalBytes: number) => downloadProgressCallback('Chromedriver', downloadedBytes, totalBytes)
    }
    if (!(await hasChromedriverInstalled(chromedriverBinaryPath))) {
        // Check if specified version of Chromedriver is available for download
        const isCombinationAvailable = await canDownload(installOptions)
        // If specified chromedriver version is not installed and there is no specified version to download, work with the latest stable version
        if (!isCombinationAvailable){
            const stableChromedriverBuildId = await resolveBuildId(Browser.CHROMEDRIVER, platform, ChromeReleaseChannel.STABLE)
            installOptions.buildId = stableChromedriverBuildId
            chromedriverBinaryPath = computeExecutablePath({
                browser: Browser.CHROMEDRIVER,
                buildId: stableChromedriverBuildId,
                cacheDir
            })
            // Check if stable version already installed
            if (!(await hasChromedriverInstalled(chromedriverBinaryPath))) {
                log.info(`Downloading Chromedriver v${installOptions.buildId}`)
                await install(installOptions)
            }
        }
    } else {
        log.info(`Using Chromedriver v${installOptions.buildId || buildId} from cache directory ${cacheDir}`)
    }
    return chromedriverBinaryPath
}

/**
 * helper method to determine if we need to start a browser driver
 * which is: whenever the user has set connection options that differ from
 * the default, or a port is set
 */
export function definesRemoteDriver(options: Options.WebDriver) {
    return Boolean(
        (options.protocol && options.protocol !== DEFAULTS.protocol.default) ||
        (options.hostname && options.hostname !== DEFAULTS.hostname.default) ||
        Boolean(options.port) ||
        (options.path && options.path !== DEFAULTS.path.default)
    )
}
