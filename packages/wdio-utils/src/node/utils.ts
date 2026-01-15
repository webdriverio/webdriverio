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
    type InstallOptions, type BrowserProvider, type DownloadOptions
} from '@puppeteer/browsers'
import { download as downloadGeckodriver } from 'geckodriver'
import { download as downloadEdgedriver } from 'edgedriver'
import { locateChrome, locateFirefox, locateApp } from 'locate-app'
import { chromiumToElectron } from 'electron-to-chromium'
import type { EdgedriverParameters } from 'edgedriver'
import type { Options } from '@wdio/types'

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
 *
 * @description
 * When installing a package, progress updates are logged using `log.progress`.
 * To ensure the formatting of subsequent logs is not disrupted, it's essential to clear the progress log after the installation is complete.
 * This method combines the installation step and the clearing of the progress log.
 *
 * @see {@link https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-logger/README.md#custom-log-levels} for more information.
 *
 * @param {InstallOptions & { unpack?: true | undefined }} args - An object containing installation options and an optional `unpack` flag.
 * @returns {Promise<void>} A Promise that resolves once the package is installed and clear the progress log.
 */
const _install = async (args: InstallOptions & { unpack?: true | undefined }, retry = false): Promise<string> => {
    const result = await install(args).catch((err) => {
        const error = `Failed downloading ${args.browser} v${args.buildId} using ${JSON.stringify(args)}: ${err.message}, retrying ...`
        if (retry) {
            err.message += '\n' + error.replace(', retrying ...', '')
            throw new Error(err)
        }
        log.error(error)
        return _install(args, true)
    })
    log.progress('')
    // When unpack=true, install returns InstalledBrowser object, extract the path
    return typeof result === 'string' ? result : result.path
}

/**
 * Installs a package and returns the InstalledBrowser object for custom downloader support.
 * This variant preserves the custom executable path from custom downloaders.
 */
const _installWithBrowser = async (args: InstallOptions & { unpack: true }, retry = false): Promise<InstalledBrowser> => {
    const result = await install(args).catch((err: Error) => {
        const error = `Failed downloading ${args.browser} v${args.buildId} using ${JSON.stringify(args)}: ${err.message}, retrying ...`
        if (retry) {
            err.message += '\n' + error.replace(', retrying ...', '')
            throw new Error(err.message)
        }
        log.error(error)
        return _installWithBrowser(args, true)
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
    const installOptions: InstallOptions & { unpack?: true } = {
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
 * Determine the appropriate platform, with ARM Linux override.
 */
function resolveChromedriverPlatform(): BrowserPlatform {
    const platform = detectBrowserPlatform()
    const actualPlatform = (platform === 'linux' && process.arch === 'arm64') ? BrowserPlatform.LINUX_ARM : platform

    if (actualPlatform !== platform) {
        log.info(`Overriding platform from ${platform} to ${actualPlatform} for ARM Linux`)
    }

    if (!actualPlatform) {
        throw new Error('The current platform is not supported.')
    }

    return actualPlatform
}

export async function setupChromedriver (cacheDir: string, driverVersion?: string, capabilities?: WebdriverIO.Capabilities) {
    const platform = resolveChromedriverPlatform()
    const { chromiumVersion, electronVersion } = parseElectronCapabilities(capabilities)

    // Determine buildId and providers based on capabilities
    let buildId: string
    let providers: BrowserProvider[] | undefined

    if (electronVersion) {
        // Use Electron provider with Electron version
        providers = [new ElectronDownloader()]
        buildId = electronVersion
        log.info(`Using Electron provider with Electron v${buildId} (Chromium ${chromiumVersion})`)
    } else if (chromiumVersion) {
        // Fallback: use Chromium version with Electron provider
        providers = [new ElectronDownloader()]
        buildId = chromiumVersion
        log.info(`Using Electron provider with Chromium v${buildId}`)
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

    let installedBrowser: Awaited<ReturnType<typeof _installWithBrowser>>

    try {
        installedBrowser = await _installWithBrowser(installOptions)
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
                    installedBrowser = await _installWithBrowser({ ...installOptions, buildId: fallbackBuildId })
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

// ============================================================================
// Electron Downloader Implementation
// ============================================================================

type ElectronRelease = {
    chrome: string;
    version: string;
}

/**
 * Cache for Chromium → Electron version mapping.
 * Fetched from electronjs.org/headers/index.json on first use.
 */
let chromiumToElectronCache: Record<string, string> | null = null

/**
 * Fetches the Electron releases list and builds a Chromium → Electron mapping.
 * This provides the most up-to-date version information.
 */
async function fetchChromiumToElectronMapping(): Promise<Record<string, string>> {
    if (chromiumToElectronCache) {
        return chromiumToElectronCache
    }

    try {
        log.debug('Fetching Electron releases for Chromium → Electron version mapping...')
        const response = await fetch('https://electronjs.org/headers/index.json')
        const releases = (await response.json()) as ElectronRelease[]

        // Build reverse mapping: Chromium version → Electron version
        const mapping: Record<string, string> = {}
        for (const { chrome, version } of releases) {
            mapping[chrome] = version
        }

        chromiumToElectronCache = mapping
        log.debug(`Fetched ${Object.keys(mapping).length} Electron release mappings`)
        return mapping
    } catch (error) {
        log.debug('Failed to fetch Electron releases:', error)
        throw error
    }
}

/**
 * Maps BrowserPlatform to Electron release platform names.
 */
function mapPlatformForElectron(platform: BrowserPlatform): string {
    const platformMap: Record<BrowserPlatform, string> = {
        [BrowserPlatform.LINUX]: 'linux-x64',
        [BrowserPlatform.LINUX_ARM]: 'linux-arm64',
        [BrowserPlatform.MAC]: 'darwin-x64',
        [BrowserPlatform.MAC_ARM]: 'darwin-arm64',
        [BrowserPlatform.WIN32]: 'win32-ia32',
        [BrowserPlatform.WIN64]: 'win32-x64'
    }

    const mapped = platformMap[platform]
    if (!mapped) {
        throw new Error(`Unsupported platform for Electron: ${platform}`)
    }
    return mapped
}

/**
 * Resolves a version to an Electron version.
 * Handles both Electron versions (pass-through) and Chromium versions (mapped).
 *
 * Attempts to fetch the latest mappings from electronjs.org first,
 * then falls back to the electron-to-chromium package.
 */
async function resolveElectronVersion(buildId: string, versionMapping?: Record<string, string>): Promise<string | null> {
    // If it looks like an Electron version (e.g., "33.2.1"), return as-is
    if (/^\d+\.\d+\.\d+$/.test(buildId)) {
        return buildId
    }

    // If custom mapping provided, try that first
    if (versionMapping && buildId in versionMapping) {
        return versionMapping[buildId]
    }

    // Try fetching from electronjs.org for most up-to-date mappings
    try {
        const mapping = await fetchChromiumToElectronMapping()
        if (buildId in mapping) {
            return mapping[buildId]
        }
    } catch (error: unknown) {
        // Fall through to electron-to-chromium package
        log.debug('Falling back to electron-to-chromium package', (error as Error).message)
    }

    // Fall back to electron-to-chromium package for offline/cached lookup
    const electronVersion = chromiumToElectron(buildId)

    // chromiumToElectron returns either:
    // - a string (for major version queries)
    // - an array of strings (for full version queries)
    // - undefined (if no match)
    if (Array.isArray(electronVersion)) {
        // Return the first (latest) matching Electron version
        return electronVersion[0] || null
    }

    return electronVersion || null
}

/**
 * Options for ElectronDownloader.
 *
 * ElectronDownloader is a custom browser provider that downloads
 * Chromedriver from Electron releases instead of Chrome for Testing.
 */
export interface ElectronDownloaderOptions {
    /**
     * Only use Electron provider for specific platforms.
     * If not specified, Electron releases will be used for all platforms.
     *
     * @example
     * ```typescript
     * // Only use for ARM64 Linux, let Chrome for Testing handle others
     * new ElectronDownloader({ platforms: [BrowserPlatform.LINUX_ARM] })
     * ```
     */
    platforms?: BrowserPlatform[];

    /**
     * Custom base URL for Electron releases.
     * @default 'https://github.com/electron/electron/releases/download/'
     */
    baseUrl?: string;

    /**
     * Optional custom version mapping from Chromium version to Electron version.
     * Has the highest priority in the version resolution fallback chain.
     *
     * The version resolution order is:
     * 1. Custom versionMapping (if provided)
     * 2. Cached electronjs.org mappings (if initializeElectronMappings() was called)
     * 3. electron-to-chromium package (always available)
     *
     * Only provide this if you need to override specific version mappings.
     *
     * @example
     * ```typescript
     * new ElectronDownloader({
     *   versionMapping: {
     *     '131.0.0.0': '34.0.0' // Override for unreleased versions
     *   }
     * })
     * ```
     */
    versionMapping?: Record<string, string>;
}

/**
 * Browser provider that uses Electron releases for Chromedriver.
 *
 * This is particularly useful for platforms where Chrome for Testing
 * doesn't provide binaries, such as Linux ARM64.
 *
 * **Version Mapping Strategy:**
 *
 * The provider uses a two-tier fallback for Chromium → Electron version mapping:
 * 1. **electronjs.org releases API** (most up-to-date, fetched on first use and cached)
 * 2. **electron-to-chromium package** (offline fallback, may be slightly outdated)
 *
 * **Supports two modes:**
 *
 * 1. **Electron apps**: Pass Electron version directly (e.g., "33.2.1")
 * 2. **Non-Electron apps**: Pass Chromium version (e.g., "130.0.6723.2"),
 *    which gets mapped to an Electron version automatically
 *
 * @example
 * ```typescript
 * // For Electron apps - pass Electron version
 * const buildId = electronVersion; // "33.2.1"
 *
 * // For non-Electron apps - pass Chromium version, restrict to ARM64
 * const providers = [
 *   new ElectronDownloader({
 *     platforms: [BrowserPlatform.LINUX_ARM]
 *   })
 * ];
 * await install({
 *   browser: Browser.CHROMEDRIVER,
 *   buildId: '130.0.6723.2', // Chromium version
 *   providers
 * });
 * // → Fetches mapping from electronjs.org (cached after first fetch)
 * // → Maps to Electron v33.2.1
 * // → Downloads chromedriver from Electron v33.2.1 release
 * ```
 */
export class ElectronDownloader implements BrowserProvider {
    readonly #platforms?: BrowserPlatform[]
    readonly #baseUrl: string
    readonly #versionMapping?: Record<string, string>

    constructor(options: ElectronDownloaderOptions = {}) {
        this.#platforms = options.platforms
        this.#baseUrl = options.baseUrl || 'https://github.com/electron/electron/releases/download/'
        this.#versionMapping = options.versionMapping
    }

    async supports(options: DownloadOptions): Promise<boolean> {
        // Only support Chromedriver
        if (options.browser !== Browser.CHROMEDRIVER) {
            return false
        }

        // Check if we handle this platform
        if (this.#platforms && !this.#platforms.includes(options.platform)) {
            return false
        }

        // Check if we can resolve this version to an Electron version
        const electronVersion = await resolveElectronVersion(options.buildId, this.#versionMapping)
        return electronVersion !== null
    }

    async getDownloadUrl(options: DownloadOptions): Promise<URL | null> {
        // Resolve buildId to Electron version
        // (pass-through if already Electron version, map if Chromium version)
        const electronVersion = await resolveElectronVersion(options.buildId, this.#versionMapping)
        if (!electronVersion) {
            return null
        }

        const electronPlatform = mapPlatformForElectron(options.platform)
        const urlPath = `v${electronVersion}/chromedriver-v${electronVersion}-${electronPlatform}.zip`
        return new URL(urlPath, this.#baseUrl)
    }

    getExecutablePath(options: {
        browser: Browser
        buildId: string
        platform: BrowserPlatform
    }): string {
        // Electron chromedriver archives may have different structures.
        // Try the most common path first.
        const binaryName = options.platform.includes('win') ? 'chromedriver.exe' : 'chromedriver'
        return binaryName
    }
}
