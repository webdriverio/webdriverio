import os from 'node:os'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import cp from 'node:child_process'

import decamelize from 'decamelize'
import logger from '@wdio/logger'
import {
    install, canDownload, resolveBuildId, detectBrowserPlatform, Browser, BrowserPlatform, ChromeReleaseChannel,
    computeExecutablePath, type InstalledBrowser,
    type InstallOptions, type BrowserProvider
} from '@puppeteer/browsers'
import { download as downloadGeckodriver } from 'geckodriver'
import { download as downloadEdgedriver } from 'edgedriver'
import { locateChrome, locateFirefox, locateApp } from 'locate-app'
import type { EdgedriverParameters } from 'edgedriver'
import type { Options } from '@wdio/types'

import { ElectronChromedriverProvider } from './electronChromedriverProvider.js'

const log = logger('webdriver')
const EXCLUDED_PARAMS = ['version', 'help']

/**
 * Helper utility to check file access
 * @param {string} file file to check access for
 * @return              true if file can be accessed
 */
export const canAccess = (file?: string) => {
    if (!file) {
        return false
    }

    try {
        fs.accessSync(file)
        return true
    } catch {
        return false
    }
}

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

    const result = cp.spawnSync(chromePath, ['--version', '--no-sandbox'], {
        encoding: 'utf8',
        env: process.env
    })

    if (result.error) {
        throw result.error
    }

    const versionSanitized = result.stdout.trim().split(' ').find((s) => s.split('.').length === 4)
    if (!versionSanitized) {
        throw new Error(`Couldn't find valid Chrome version from "${result.stdout}", please raise an issue in the WebdriverIO project (https://github.com/webdriverio/webdriverio/issues/new/choose)`)
    }
    return versionSanitized
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
            .map((line) => line.replace(/Version=/g, '').replace(/\r/g, ''))
            .pop()
    }

    const result = cp.spawnSync(firefoxPath, ['--version'], {
        encoding: 'utf8',
        env: process.env
    })

    if (result.error) {
        throw result.error
    }

    return result.stdout.trim().split(' ').pop()?.trim()
}

let lastTimeCalled = Date.now()
export const downloadProgressCallback = (artifact: string, downloadedBytes: number, totalBytes: number) => {
    if (Date.now() - lastTimeCalled < 1000) {
        return
    }
    const percentage = ((downloadedBytes / totalBytes) * 100).toFixed(2)
    log.progress(`Downloading ${artifact} ${percentage}%`)
    lastTimeCalled = Date.now()
}

/**
 * Installs a package using the provided installation options and clears the progress log afterward.
 * Returns the InstalledBrowser object which includes the executable path (important for custom providers).
 *
 * @description
 * When installing a package, progress updates are logged using `log.progress`.
 * To ensure the formatting of subsequent logs is not disrupted, it's essential to clear the progress log after the installation is complete.
 * This method combines the installation step and the clearing of the progress log.
 *
 * @see {@link https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-logger/README.md#custom-log-levels} for more information.
 *
 * @param {InstallOptions & { unpack: true }} args - An object containing installation options with unpack enabled.
 * @returns {Promise<InstalledBrowser>} A Promise that resolves with the installed browser info.
 */
const _install = async (args: InstallOptions & { unpack: true }, retry = false): Promise<InstalledBrowser> => {
    const result = await install(args).catch((err: Error) => {
        const error = `Failed downloading ${args.browser} v${args.buildId} using ${JSON.stringify(args)}: ${err.message}, retrying ...`
        if (retry) {
            err.message += '\n' + error.replace(', retrying ...', '')
            throw new Error(err.message)
        }
        log.error(error)
        return _install(args, true)
    })
    log.progress('')
    return result
}

function locateChromeSafely () {
    return locateChrome().catch(() => undefined)
}

export async function setupPuppeteerBrowser(cacheDir: string, caps: WebdriverIO.Capabilities) {
    caps.browserName = caps.browserName?.toLowerCase()

    const browserName = caps.browserName === Browser.FIREFOX
        ? Browser.FIREFOX
        : caps.browserName === Browser.CHROMIUM
            ? Browser.CHROMIUM
            : Browser.CHROME
    const exist = await fsp.access(cacheDir).then(() => true, () => false)
    const isChromeOrChromium = browserName === Browser.CHROME || caps.browserName === Browser.CHROMIUM
    if (!exist) {
        await fsp.mkdir(cacheDir, { recursive: true })
    }

    /**
     * in case we run Chromium tests we have to switch back to browserName: 'chrome'
     * as 'chromium' is not recognised as a valid browser name by Chromedriver
     */
    if (browserName === Browser.CHROMIUM) {
        caps.browserName = Browser.CHROME
    }

    /**
     * don't set up Chrome/Firefox if a binary was defined in caps
     */
    const browserOptions = (isChromeOrChromium
        ? caps['goog:chromeOptions']
        : caps['moz:firefoxOptions']
    ) || {}
    if (typeof browserOptions.binary === 'string') {
        return {
            executablePath: browserOptions.binary,
            browserVersion: (
                caps.browserVersion ||
                (
                    isChromeOrChromium
                        ? getBuildIdByChromePath(browserOptions.binary)
                        : await getBuildIdByFirefoxPath(browserOptions.binary)
                )
            )
        }
    }

    const platform = detectBrowserPlatform()
    if (!platform) {
        throw new Error('The current platform is not supported.')
    }

    if (!caps.browserVersion) {
        const executablePath = browserName === Browser.CHROME
            ? await locateChromeSafely()
            : browserName === Browser.CHROMIUM
                ? await locateApp({
                    appName: Browser.CHROMIUM,
                    macOsName: Browser.CHROMIUM,
                    linuxWhich: 'chromium-browser'
                }).catch(() => undefined)
                : await locateFirefox().catch(() => undefined)
        const browserVersion = isChromeOrChromium
            ? getBuildIdByChromePath(executablePath)
            : await getBuildIdByFirefoxPath(executablePath)
        /**
         * verify that we have a valid Chrome/Firefox browser installed
         */
        if (browserVersion) {
            return {
                executablePath,
                browserVersion
            }
        }
    }

    /**
     * otherwise download provided Chrome/Firefox browser version or "stable"
     */
    const tag = browserName === Browser.CHROME
        ? caps.browserVersion || ChromeReleaseChannel.STABLE
        : caps.browserVersion || 'latest'
    const buildId = await resolveBuildId(browserName, platform, tag)
    const installOptions: InstallOptions & { unpack: true } = {
        unpack: true,
        cacheDir,
        platform,
        buildId,
        browser: browserName,
        downloadProgressCallback: (downloadedBytes, totalBytes) => downloadProgressCallback(`${browserName} (${buildId})`, downloadedBytes, totalBytes)
    }
    const isCombinationAvailable = await canDownload(installOptions)
    if (!isCombinationAvailable) {
        throw new Error(`Couldn't find a matching ${browserName} browser for tag "${buildId}" on platform "${platform}"`)
    }

    log.info(`Setting up ${browserName} v${buildId}`)
    await _install(installOptions)
    const executablePath = computeExecutablePath(installOptions)

    /**
     * for Chromium browser `resolveBuildId` returns with a useless build id
     * which will not find a Chromedriver, therefor we need to resolve the
     * id using Chrome as browser name
     */
    let browserVersion = buildId
    if (browserName === Browser.CHROMIUM) {
        browserVersion = await resolveBuildId(Browser.CHROME, platform, tag)
    }

    return { executablePath, browserVersion }
}

export function getDriverOptions (caps: WebdriverIO.Capabilities) {
    return (
        caps['wdio:chromedriverOptions'] ||
        caps['wdio:geckodriverOptions'] ||
        caps['wdio:edgedriverOptions'] ||
        // Safaridriver does not have any options as it already
        // is installed on macOS
        {}
    )
}

export function getCacheDir (options: Pick<Options.WebDriver, 'cacheDir'>, caps: WebdriverIO.Capabilities) {
    const driverOptions = getDriverOptions(caps)
    return driverOptions.cacheDir || options.cacheDir || os.tmpdir()
}

export function getMajorVersionFromString(fullVersion:string) {
    let prefix
    if (fullVersion) {
        prefix = fullVersion.match(/^[+-]?([0-9]+)/)
    }
    return prefix && prefix.length > 0 ? prefix[0] : ''
}

/**
 * Extract Electron-related capabilities from WebdriverIO capabilities object.
 * Handles both direct and W3C capabilities formats.
 */
function parseElectronCapabilities(capabilities?: WebdriverIO.Capabilities) {
    if (!capabilities) {
        return { chromiumVersion: undefined, electronVersion: undefined }
    }

    // Type for capabilities with custom properties
    type CapabilitiesWithCustomProps = Record<string, unknown> & {
        alwaysMatch?: Record<string, unknown>;
    }

    // Check direct capabilities
    const caps = capabilities as CapabilitiesWithCustomProps
    const chromiumVersion = caps['wdio:chromiumVersion'] as string | undefined
    const electronVersion = caps['wdio:electronVersion'] as string | undefined

    // Also check for W3C format capabilities
    const w3cCapabilities = caps.alwaysMatch || caps
    const w3cChromiumVersion = w3cCapabilities['wdio:chromiumVersion'] as string | undefined
    const w3cElectronVersion = w3cCapabilities['wdio:electronVersion'] as string | undefined

    // Use the versions found (prefer direct access, fallback to W3C)
    return {
        chromiumVersion: chromiumVersion || w3cChromiumVersion,
        electronVersion: electronVersion || w3cElectronVersion
    }
}

/**
 * Determine the appropriate platform, with ARM overrides.
 */
function resolveChromedriverPlatform(): { platform: BrowserPlatform; isWindowsArm64: boolean } {
    const platform = detectBrowserPlatform()
    const actualPlatform = (platform === BrowserPlatform.LINUX && process.arch === 'arm64') ? BrowserPlatform.LINUX_ARM : platform

    if (actualPlatform !== platform) {
        log.info(`Overriding platform from ${platform} to ${actualPlatform} for ARM Linux`)
    }

    if (!actualPlatform) {
        throw new Error('The current platform is not supported.')
    }

    // Windows ARM64 detection - detectBrowserPlatform() returns WIN64 for both x64 and ARM64
    const isWindowsArm64 = process.platform === 'win32' && process.arch === 'arm64'

    return { platform: actualPlatform, isWindowsArm64 }
}

export async function setupChromedriver (cacheDir: string, driverVersion?: string, capabilities?: WebdriverIO.Capabilities) {
    const { platform, isWindowsArm64 } = resolveChromedriverPlatform()
    const { chromiumVersion, electronVersion } = parseElectronCapabilities(capabilities)

    // Platforms where Chrome for Testing doesn't provide native binaries
    // Windows ARM64 is detected separately since detectBrowserPlatform() returns WIN64
    const unsupportedPlatforms = [BrowserPlatform.LINUX_ARM]
    const needsAlternativeProvider = unsupportedPlatforms.includes(platform) || isWindowsArm64

    // Determine buildId and providers based on capabilities
    let buildId: string
    let providers: BrowserProvider[] | undefined

    if (electronVersion) {
        // Use Electron provider with Electron version
        providers = [new ElectronChromedriverProvider()]
        buildId = electronVersion
        log.info(`Using Electron provider with Electron v${buildId} (Chromium ${chromiumVersion})`)
    } else if (chromiumVersion || needsAlternativeProvider) {
        // Use Electron provider with Chromium version OR for unsupported platforms
        providers = [new ElectronChromedriverProvider()]

        // For fallback scenario, we need to resolve "stable" to an actual version
        // that the Electron provider can map to an Electron release
        let detectedVersion = chromiumVersion || driverVersion || getBuildIdByChromePath(await locateChromeSafely())

        if (!detectedVersion && needsAlternativeProvider) {
            // No Chrome detected - resolve "stable" from Chrome for Testing to get actual version
            log.info('No Chrome installation detected. Resolving latest stable version...')
            detectedVersion = await resolveBuildId(Browser.CHROME, platform, ChromeReleaseChannel.STABLE)
        }

        buildId = detectedVersion || ChromeReleaseChannel.STABLE

        if (needsAlternativeProvider && !chromiumVersion) {
            const platformName = isWindowsArm64 ? 'Windows ARM64' : platform
            log.info(`Chrome for Testing doesn't provide native binaries for ${platformName}. Using Electron releases as fallback with Chrome v${buildId}.`)
        } else if (chromiumVersion) {
            log.info(`Using Electron provider with Chromium v${buildId}`)
        }
    } else {
        // Use standard Chrome chromedriver logic (no Electron provider)
        const version = driverVersion || getBuildIdByChromePath(await locateChromeSafely()) || ChromeReleaseChannel.STABLE
        buildId = await resolveBuildId(Browser.CHROMEDRIVER, platform, version)
        log.info(`Using standard Chrome chromedriver logic, resolved buildId=${buildId}`)
    }

    const installOptions = {
        cacheDir,
        buildId,
        platform,
        browser: Browser.CHROMEDRIVER,
        unpack: true,
        downloadProgressCallback: (downloadedBytes, totalBytes) => downloadProgressCallback('Chromedriver', downloadedBytes, totalBytes),
        providers
    } satisfies InstallOptions & { unpack: true; providers?: BrowserProvider[] }

    let installedBrowser: Awaited<ReturnType<typeof _install>>

    try {
        installedBrowser = await _install(installOptions)
        log.info(`Download of Chromedriver v${buildId} was successful`)
    } catch (error) {
        // If the primary download failed and we're using Electron, try a fallback version
        if (chromiumVersion) {
            log.warn(`Chromedriver v${buildId} download failed, trying latest compatible version...`)
            const fallbackVersion = getMajorVersionFromString(chromiumVersion)
            const fallbackBuildId = await resolveBuildId(Browser.CHROMEDRIVER, platform, fallbackVersion)

            if (fallbackBuildId !== buildId) {
                log.info(`Trying fallback Chromedriver v${fallbackBuildId}`)
                try {
                    installedBrowser = await _install({ ...installOptions, buildId: fallbackBuildId })
                    log.info(`Download of Chromedriver v${fallbackBuildId} was successful`)
                    buildId = fallbackBuildId
                } catch (fallbackError) {
                    log.error(`Fallback Chromedriver download also failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`)
                    throw new Error(`Couldn't download Chromedriver v${buildId} or fallback v${fallbackBuildId}`)
                }
            } else {
                throw new Error(`Couldn't download Chromedriver v${buildId}`)
            }
        } else {
            throw error
        }
    }

    // Use the executable path from InstalledBrowser - this automatically uses
    // custom paths from providers that implement getExecutablePath()
    const executablePath = installedBrowser.executablePath

    if (providers?.length) {
        log.info(`Using custom provider executable path: ${executablePath}`)
    }

    return { executablePath }
}

export function setupGeckodriver (cacheDir: string, driverVersion?: string) {
    return downloadGeckodriver(driverVersion, cacheDir)
}

export function setupEdgedriver (cacheDir: string, driverVersion?: string) {
    return downloadEdgedriver(driverVersion, cacheDir)
}

export function generateDefaultPrefs(caps: WebdriverIO.Capabilities) {
    return caps['goog:chromeOptions']?.debuggerAddress
        ? {}
        : { prefs: { 'profile.password_manager_leak_detection': false } }
}
