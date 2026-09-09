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
import { locateChrome, locateFirefox, locateApp } from 'locate-app'
import type { EdgedriverParameters } from 'edgedriver'
import type { Options } from '@wdio/types'

import { ElectronChromedriverProvider } from './electronChromedriverProvider.js'

const log = logger('webdriver')
const EXCLUDED_PARAMS = ['version', 'help']
export const DEFAULT_EDGEDRIVER_CDN_URL = 'https://msedgedriver.microsoft.com'
const LEGACY_EDGEDRIVER_CDN_URL = 'https://msedgedriver.azureedge.net'

export function setDefaultEdgedriverCdnUrl () {
    const edgedriverCdnUrl = process.env.EDGEDRIVER_CDNURL?.replace(/\/+$/, '')
    if (!edgedriverCdnUrl || edgedriverCdnUrl === LEGACY_EDGEDRIVER_CDN_URL) {
        process.env.EDGEDRIVER_CDNURL = DEFAULT_EDGEDRIVER_CDN_URL
    }
}

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
            log.info(`Using pre-installed ${browserName} v${browserVersion}${executablePath ? ` from ${executablePath}` : ''}`)
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
    return driverOptions.cacheDir || options.cacheDir || process.env.WEBDRIVER_CACHE_DIR || os.tmpdir()
}

export function getMajorVersionFromString(fullVersion:string) {
    let prefix
    if (fullVersion) {
        prefix = fullVersion.match(/^[+-]?([0-9]+)/)
    }
    return prefix && prefix.length > 0 ? prefix[0] : ''
}

/**
 * Reads `wdio:electronVersion` from both flat and W3C (alwaysMatch) capability shapes.
 */
function parseElectronVersion(capabilities?: WebdriverIO.Capabilities): string | undefined {
    const caps = (capabilities ?? {}) as Record<string, unknown> & { alwaysMatch?: Record<string, unknown> }
    return (caps['wdio:electronVersion'] as string | undefined)
        || (caps.alwaysMatch?.['wdio:electronVersion'] as string | undefined)
}

export async function setupChromedriver (cacheDir: string, driverVersion?: string, capabilities?: WebdriverIO.Capabilities) {
    // detectBrowserPlatform() already resolves linux+arm64 to BrowserPlatform.LINUX_ARM.
    const platform = detectBrowserPlatform()
    if (!platform) {
        throw new Error('The current platform is not supported.')
    }
    const electronVersion = parseElectronVersion(capabilities)

    // Chrome for Testing now ships linux-arm64 Chromedriver, so Linux ARM64 takes the standard
    // CfT path below, with the Electron release as a fallback (`electronFallbackAvailable`).
    const electronFallbackAvailable = platform === BrowserPlatform.LINUX_ARM

    let buildId: string
    let providers: BrowserProvider[] | undefined

    if (electronVersion) {
        providers = [new ElectronChromedriverProvider()]
        buildId = electronVersion
        log.info(`Using Electron provider with Electron v${buildId}`)
    } else {
        const version = driverVersion || getBuildIdByChromePath(await locateChromeSafely()) || ChromeReleaseChannel.STABLE
        // These Chrome-for-Testing lookups run before the install() error boundary below, so on
        // Linux ARM64 a rejection here would terminate setup without ever reaching the advertised
        // Electron-release fallback. Catch it and route to the Electron provider, as the
        // install-time fallback further down does. On CfT-served platforms the failure is genuine,
        // so rethrow.
        let resolvedBuildId: string | undefined
        try {
            resolvedBuildId = await resolveBuildId(Browser.CHROMEDRIVER, platform, version)
            // If Chrome for Testing has no binary for this exact build, fall back to the
            // newest known-good build for the same Chrome major.
            const canDownloadExact = await canDownload({ cacheDir, buildId: resolvedBuildId, platform, browser: Browser.CHROMEDRIVER, unpack: true })
            if (!canDownloadExact) {
                // Derive the major from the resolved buildId, not `version`: when no Chrome is
                // detected `version` is the 'stable' channel string, whose major is empty, which
                // would make resolveBuildId throw and skip the Linux-ARM64 Electron fallback below.
                const major = getMajorVersionFromString(resolvedBuildId)
                log.warn(`Chromedriver v${resolvedBuildId} not available, resolving a known good version for major v${major}...`)
                const knownGood = await resolveBuildId(Browser.CHROMEDRIVER, platform, major)
                if (knownGood) {
                    resolvedBuildId = knownGood
                } else if (!electronFallbackAvailable) {
                    throw new Error(`Couldn't resolve a known good Chromedriver for major v${major} (requested v${version})`)
                }
                // On Linux ARM64 with no known-good CfT build, keep the exact buildId and let the
                // install below fall through to the Electron-release fallback in the catch block.
            }
            buildId = resolvedBuildId
            log.info(`Using standard Chrome chromedriver logic, resolved buildId=${buildId}`)
        } catch (error) {
            if (!electronFallbackAvailable) {
                throw error
            }
            log.warn(`Chrome for Testing couldn't resolve Chromedriver for ${platform}: ${error instanceof Error ? error.message : String(error)}. Falling back to Electron releases...`)
            // The Electron provider maps a concrete Chromium version, so hand it a real version,
            // not the 'stable' channel string. BrowserPlatform.LINUX is always served by CfT, so
            // resolving stable against it is a safe last resort when nothing better is known.
            buildId = resolvedBuildId
                ?? (version !== ChromeReleaseChannel.STABLE
                    ? version
                    : await resolveBuildId(Browser.CHROME, BrowserPlatform.LINUX, ChromeReleaseChannel.STABLE))
            providers = [new ElectronChromedriverProvider()]
        }
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
        log.info(`Chromedriver v${buildId} is ready`)
    } catch (error) {
        // Standard Chrome-for-Testing path failed on Linux ARM64 (Chromium milestone below
        // CfT's arm64 floor, or a CfT outage). Retry the same build from the matching
        // Electron release. Elsewhere the failure is genuine, so rethrow.
        if (electronFallbackAvailable && !providers) {
            log.warn(`Chrome for Testing couldn't provide Chromedriver v${buildId} for ${platform}: ${error instanceof Error ? error.message : String(error)}. Falling back to Electron releases...`)
            installedBrowser = await _install({ ...installOptions, providers: [new ElectronChromedriverProvider()] })
            log.info(`Chromedriver v${buildId} is ready (via Electron fallback)`)
        } else {
            throw error
        }
    }

    // installedBrowser.executablePath already reflects a custom provider's getExecutablePath()
    const executablePath = installedBrowser.executablePath

    if (providers?.length) {
        log.info(`Using custom provider executable path: ${executablePath}`)
    }

    return { executablePath }
}

export function setupGeckodriver (cacheDir: string, driverVersion?: string) {
    return downloadGeckodriver(driverVersion, cacheDir)
}

export async function setupEdgedriver (cacheDir: string, driverVersion?: string) {
    setDefaultEdgedriverCdnUrl()
    const { download: downloadEdgedriver } = await import('edgedriver')
    return downloadEdgedriver(driverVersion, cacheDir)
}

export function generateDefaultPrefs(caps: WebdriverIO.Capabilities) {
    return caps['goog:chromeOptions']?.debuggerAddress
        ? {}
        : { prefs: { 'profile.password_manager_leak_detection': false } }
}
