import os from 'node:os'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import cp from 'node:child_process'

import got from 'got'
import logger from '@wdio/logger'

import { getChromePath } from 'chrome-launcher'
import {
    install, canDownload, resolveBuildId, detectBrowserPlatform, Browser, ChromeReleaseChannel,
    computeExecutablePath, type InstallOptions
} from '@puppeteer/browsers'

import { logDownload } from './utils.js'

const log = logger('@wdio/utils')

import type { Options, Capabilities } from '@wdio/types'
import type { EdgedriverParameters } from './edge'
export type ChromedriverParameters = InstallOptions & Omit<EdgedriverParameters, 'port' | 'edgeDriverVersion' | 'customEdgeDriverPath'>

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

export function getCacheDir(options: Pick<Options.WebDriver, 'cacheDir'>, caps: Capabilities.Capabilities) {
    const driverOptions: { cacheDir?: string } = caps['wdio:chromedriverOptions'] || {}
    return driverOptions.cacheDir || options.cacheDir || os.tmpdir()
}

export async function setupChromedriver(cacheDir: string, driverVersion?: string) {
    const platform = detectBrowserPlatform()
    if (!platform) {
        throw new Error('The current platform is not supported.')
    }

    const version = driverVersion || getBuildIdByPath(getLocalChromePath()) || ChromeReleaseChannel.STABLE
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
        const chromedriverInstallOpts: InstallOptions & { unpack?: true } = {
            cacheDir,
            buildId,
            platform,
            browser: Browser.CHROMEDRIVER,
            unpack: true,
            downloadProgressCallback: (downloadedBytes, totalBytes) => logDownload('Chromedriver', downloadedBytes, totalBytes)
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

export async function setupChrome(cacheDir: string, caps: Capabilities.Capabilities) {
    caps.browserName = caps.browserName?.toLowerCase()
    const exist = await fsp.access(cacheDir).then(() => true, () => false)
    if (!exist) {
        await fsp.mkdir(cacheDir, { recursive: true })
    }

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
                cacheDir,
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
        downloadProgressCallback: (downloadedBytes, totalBytes) => logDownload('Chrome', downloadedBytes, totalBytes)
    }
    const isCombinationAvailable = await canDownload(installOptions)
    if (!isCombinationAvailable) {
        throw new Error(`Couldn't find a matching Chrome browser for tag "${buildId}" on platform "${platform}"`)
    }

    log.info(`Setting up Chrome v${buildId}`)
    await install(installOptions)
    const executablePath = computeExecutablePath(installOptions)
    return { executablePath, browserVersion: buildId }
}

