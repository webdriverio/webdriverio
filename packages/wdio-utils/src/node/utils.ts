import os from 'node:os'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import cp from 'node:child_process'

import decamelize from 'decamelize'
import logger from '@wdio/logger'
import {
    install, canDownload, resolveBuildId, detectBrowserPlatform, getVersionComparator, Browser, BrowserPlatform,
    Cache, ChromeReleaseChannel, computeExecutablePath, type InstallOptions
} from '@puppeteer/browsers'
import { download as downloadGeckodriver } from 'geckodriver'
import { locateChrome, locateFirefox, locateApp } from 'locate-app'
import type { EdgedriverParameters } from 'edgedriver'
import type { Options } from '@wdio/types'

import { ElectronChromedriverProvider, getElectronVersionForChromium } from './electronChromedriverProvider.js'
import { warnIfDownloadProxyIgnored } from './downloadProxy.js'
import { installAtomically } from './atomicInstall.js'

const log = logger('webdriver')

/**
 * `@puppeteer/browsers` extracts zip files with the system `unzip` command (`tar.exe` or
 * PowerShell on Windows). WebdriverIO does not install its JavaScript fallback.
 */
const MISSING_ZIP_TOOL = 'no zip archiver is available'
const UNZIP_HINT = 'WebdriverIO extracts browsers and Chromedriver with the system `unzip` command ' +
    '(`tar.exe` or PowerShell on Windows). Install it, e.g. `apt-get install -y unzip` or `apk add unzip`. ' +
    'See https://webdriver.io/docs/docker#images-where-webdriverio-downloads-the-browser'
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
 * Allows to download Chromedriver from a custom host, e.g. an internal mirror
 * or artifact registry, in environments where the default CDN is not reachable.
 * This is the Chrome equivalent to the `EDGEDRIVER_CDNURL` environment variable
 * that the `edgedriver` package supports.
 * A blank value is treated as unset so that an empty variable in a CI config
 * falls back to the default CDN rather than producing an invalid url.
 * @return the configured CDN url without trailing slashes or `undefined` if not set
 */
export function getChromedriverCdnUrl () {
    return process.env.CHROMEDRIVER_CDNURL?.trim().replace(/\/+$/, '') || undefined
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
 * A custom CDN url can carry credentials, e.g. when pointing to an internal
 * artifact registry that requires basic auth. They reach our logs through the
 * install options as well as through errors raised by `@puppeteer/browsers`,
 * which embed the full download url in their message, so scrub the composed
 * message rather than a single source.
 * Only userinfo is matched: the segment has to sit between `://` and the first
 * `/`, `?` or `#`, so an `@` inside a path or query string is left alone. It
 * reaches the *last* `@` in that segment: a password may itself contain an
 * unescaped `@` and url parsers treat the last one as the delimiter, so stopping
 * at the first would leave the remainder of the password behind.
 * The scheme quantifier is bounded because an unbounded one backtracks
 * quadratically and a large message could stall the process for seconds. The
 * userinfo part is unbounded so that a long token is still scrubbed; it stays
 * linear because `/` is excluded, which keeps the run after each `://` disjoint.
 * A credential can also travel in the query string - an `?access_token=`, or a
 * signed-url signature - so the query is dropped too. Nothing downstream needs it
 * to diagnose a failed download, and the classes stop at a quote so that redacting
 * inside `JSON.stringify(args)` cannot eat the rest of the serialized object.
 * @param {string} message - a log line or error message that may contain urls
 * @returns the message with credentials stripped from any url it contains
 */
function redactCredentials (message: string) {
    return message
        .replace(/([a-zA-Z][\w+.-]{0,30}:\/\/)[^/\s?#]+@/g, '$1')
        .replace(/([a-zA-Z][\w+.-]{0,30}:\/\/[^\s"'?#]*)\?[^\s"']*/g, '$1?[redacted]')
}

/**
 * Turn whatever a promise rejected with into something worth logging. `String()`
 * alone would render a plain object as `[object Object]` and hide the reason.
 * @param {unknown} err - the rejection value
 * @returns a readable description of the rejection
 */
function describeRejection (err: unknown) {
    if (err instanceof Error) {
        return err.message
    }
    if (typeof err === 'string') {
        return err
    }

    try {
        return JSON.stringify(err) ?? String(err)
    } catch {
        return String(err)
    }
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
const _install = async (args: InstallOptions & { unpack?: true | undefined }, retry = false): Promise<void> => {
    warnIfDownloadProxyIgnored()
    await install(args).catch(async (err) => {
        /**
         * a rejection is not guaranteed to be an Error, so never assume a writable
         * `message` and never let `new Error()` stringify an object into `[object Object]`
         */
        const details = redactCredentials(`Failed downloading ${args.browser} v${args.buildId} using ${JSON.stringify(args)}: ${describeRejection(err)}`)
        /**
         * a missing zip tool fails the retry the same way
         */
        if (details.includes(MISSING_ZIP_TOOL)) {
            throw new Error(`${details}\n${UNZIP_HINT}`)
        }
        if (retry) {
            throw new Error(details)
        }
        log.error(`${details}, retrying ...`)
        /**
         * Clean up any partially extracted files before retrying.
         * Without this, @puppeteer/browsers may see an existing (incomplete)
         * output directory and skip re-downloading, causing the retry to fail
         * with "exists but executable is missing" (see issue #15608).
         * Remove the whole build folder: the executable can sit in a sub-folder of
         * it (`core/firefox.exe` on Windows), and the check is on the build folder.
         * Keep the folder when the executable is there: the install can fail after
         * the browser was extracted, e.g. when Windows still locks the Firefox
         * installer that it tries to delete, and the retry then uses that browser.
         */
        try {
            const platform = args.platform ?? detectBrowserPlatform()
            if (platform) {
                const cache = new Cache(args.cacheDir)
                const executablePath = cache.computeExecutablePath({ browser: args.browser, platform, buildId: args.buildId })
                const buildDir = cache.installationDir(args.browser, platform, args.buildId)
                if (await fsp.access(executablePath).then(() => true, () => false)) {
                    log.info(`Keeping ${args.browser} v${args.buildId} at ${buildDir}: the executable is there`)
                } else if (await fsp.access(buildDir).then(() => true, () => false)) {
                    log.warn(`Removing ${buildDir} before the retry: the executable ${executablePath} is missing`)
                    await fsp.rm(buildDir, { recursive: true, force: true }).catch((err) => {
                        log.warn(`Couldn't remove ${buildDir}, the retry can fail: ${describeRejection(err)}`)
                    })
                }
                // otherwise the download failed before the build folder was made, so there is nothing to clean
            } else {
                log.warn(`Couldn't clean up ${args.browser} v${args.buildId} before the retry: the platform is not supported`)
            }
        } catch {
            /**
             * If cleanup fails, continue with retry anyway — it may still succeed
             * if the partial directory issue resolves itself.
             */
        }
        return _install(args, true)
    })
    log.progress('')
}

/**
 * Install a build into the cache atomically (see `installAtomically()`): a half
 * installed build is never in the cache, and processes that set it up at the same time
 * download it once. `prepare(cacheDir)` runs before the install in that cache. Resolves
 * the executable to use: in the cache, or in a private folder when the build cannot be
 * moved into the cache.
 */
function installBuild (
    args: InstallOptions & { unpack?: true },
    platform: BrowserPlatform,
    executablePath: string,
    prepare?: (cacheDir: string) => void
) {
    return installAtomically({
        cacheDir: args.cacheDir,
        buildDir: (cacheDir) => new Cache(cacheDir).installationDir(args.browser, platform, args.buildId),
        executablePath,
        /**
         * in the browser folder of the cache (`Cache#browserRoot()` of `@puppeteer/browsers`),
         * without a `-`, so that the cache does not list it as a `<platform>-<buildId>` install
         */
        markerPath: path.join(args.cacheDir, args.browser, `${platform}_${args.buildId.replaceAll('-', '_')}.installing`)
    }, (cacheDir) => {
        prepare?.(cacheDir)
        return _install({ ...args, cacheDir })
    })
}

function locateChromeSafely () {
    return locateChrome().catch(() => undefined)
}

function locateInstalledBrowser (browserName: Browser) {
    if (browserName === Browser.CHROME) {
        return locateChromeSafely()
    }
    if (browserName === Browser.CHROMIUM) {
        return locateApp({
            appName: Browser.CHROMIUM,
            macOsName: Browser.CHROMIUM,
            linuxWhich: 'chromium-browser'
        }).catch(() => undefined)
    }
    return locateFirefox().catch(() => undefined)
}

function getPuppeteerBrowser (browserName?: string) {
    if (browserName === Browser.FIREFOX) {
        return Browser.FIREFOX
    }
    if (browserName === Browser.CHROMIUM) {
        return Browser.CHROMIUM
    }
    return Browser.CHROME
}

export async function setupPuppeteerBrowser(cacheDir: string, caps: WebdriverIO.Capabilities) {
    caps.browserName = caps.browserName?.toLowerCase()

    const browserName = getPuppeteerBrowser(caps.browserName)
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
        // don't probe an Electron app: running it with `--version` starts the app
        if (caps['wdio:electronVersion']) {
            return { executablePath: browserOptions.binary, browserVersion: caps.browserVersion }
        }
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
        const executablePath = await locateInstalledBrowser(browserName)
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
    /**
     * the version lookup is the first request that can ignore a configured proxy
     */
    warnIfDownloadProxyIgnored()
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
    const cachedExecutablePath = computeExecutablePath(installOptions)
    let executablePath = await installBuild(installOptions, platform, cachedExecutablePath)
    if (executablePath === cachedExecutablePath && !await fsp.access(executablePath).then(() => true, () => false)) {
        /**
         * removed meanwhile: `install()` below would download it into the cache in place
         */
        executablePath = await installBuild(installOptions, platform, cachedExecutablePath)
    }
    if (executablePath === cachedExecutablePath) {
        /**
         * `@puppeteer/browsers` finds the build and finishes it in the cache (e.g. it runs
         * Chrome's `setup.exe` on Windows for the browser folder), as for a cached build;
         * a build in a private folder was finished there
         */
        await _install(installOptions)
    }

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
 * Two capabilities can need the same driver: `chrome` and `chromium` are both in the
 * Chrome browser family, and setup groups the work by browser name, so both ask for
 * Chromedriver at the same time. The two installs then race on one cache directory
 * and whichever arrives second finds a folder that exists but has no executable in
 * it yet. Share the install that is already running instead of starting a second one.
 * The entry is dropped once it settles, so a later call can retry a failed download
 * and a successful one just finds the driver in the cache.
 */
const driverSetupsInFlight = new Map<string, Promise<unknown>>()

function shareDriverSetup<T> (key: string, setup: () => Promise<T>): Promise<T> {
    const inFlight = driverSetupsInFlight.get(key) as Promise<T> | undefined
    if (inFlight) {
        return inFlight
    }

    const setupPromise = setup().finally(() => driverSetupsInFlight.delete(key))
    driverSetupsInFlight.set(key, setupPromise)
    return setupPromise
}

/**
 * `/tmp/cache` and `/tmp/cache/` are one directory. Key on the resolved path
 * so those requests share one install.
 */
function driverCacheKey (cacheDir: string) {
    return path.resolve(cacheDir)
}

function chromedriverSetupKey (cacheDir: string, platform: string, buildId: string) {
    return `chromedriver:${driverCacheKey(cacheDir)}:${platform}:${buildId}`
}

/**
 * Chrome for Testing ships linux-arm64 Chromedriver from this build. For older builds,
 * `@puppeteer/browsers` resolves LINUX_ARM to the linux64 (x64) archive.
 */
const CFT_LINUX_ARM64_FLOOR = '153.0.8001.0'

export async function setupChromedriver (cacheDir: string, driverVersion?: string, electronVersion?: string) {
    const platform = detectBrowserPlatform()
    if (!platform) {
        throw new Error('The current platform is not supported.')
    }

    if (electronVersion && !(driverVersion && getChromedriverCdnUrl())) {
        const electronChromedriver = await installElectronChromedriver(cacheDir, platform, electronVersion).catch((err) => {
            if (!driverVersion) {
                throw err
            }
            log.warn(`Couldn't download Chromedriver from Electron v${electronVersion}, using the one for Chrome v${driverVersion}: ${describeRejection(err)}`)
        })
        if (electronChromedriver) {
            return electronChromedriver
        }
    }

    const version = driverVersion || getBuildIdByChromePath(await locateChromeSafely()) || ChromeReleaseChannel.STABLE
    /**
     * resolve before sharing, so that requests which only look different - `undefined`,
     * `'stable'` and an explicit version that all point at the same build - land on the
     * same key. Resolving reads no state and writes nothing, so doing it twice is free.
     */
    warnIfDownloadProxyIgnored()
    const buildId = await resolveBuildId(Browser.CHROMEDRIVER, platform, version)
    if (platform === BrowserPlatform.LINUX_ARM && getVersionComparator(Browser.CHROMEDRIVER)(buildId, CFT_LINUX_ARM64_FLOOR) < 0) {
        const matchingElectronVersion = getElectronVersionForChromium(buildId)
        if (!matchingElectronVersion) {
            throw new Error(
                `Chrome for Testing has no linux-arm64 Chromedriver before v${CFT_LINUX_ARM64_FLOOR}, and no Electron release ships one for Chrome v${buildId}. ` +
                'See https://webdriver.io/docs/arm64-chromedriver'
            )
        }
        return installElectronChromedriver(cacheDir, platform, matchingElectronVersion)
    }

    return shareDriverSetup(
        chromedriverSetupKey(cacheDir, platform, buildId),
        () => installChromedriver(cacheDir, platform, version, buildId)
    ).catch((err) => {
        const fallbackElectronVersion = !getChromedriverCdnUrl() && getElectronVersionForChromium(buildId)
        if (!fallbackElectronVersion) {
            throw err
        }
        log.warn(`Couldn't download Chromedriver v${buildId} from Chrome for Testing, using the one from Electron v${fallbackElectronVersion}: ${describeRejection(err)}`)
        return installElectronChromedriver(cacheDir, platform, fallbackElectronVersion).catch((electronErr) => {
            log.warn(`Couldn't download Chromedriver from Electron v${fallbackElectronVersion} either: ${describeRejection(electronErr)}`)
            throw err
        })
    })
}

function installElectronChromedriver (cacheDir: string, platform: BrowserPlatform, electronVersion: string) {
    return shareDriverSetup(chromedriverSetupKey(cacheDir, platform, electronVersion), async () => {
        const cache = new Cache(cacheDir)
        const provider = new ElectronChromedriverProvider()
        const relativeExecutablePath = provider.getExecutablePath()
        let executablePath = path.join(cache.installationDir(Browser.CHROMEDRIVER, platform, electronVersion), relativeExecutablePath)
        if (!await fsp.access(executablePath).then(() => true, () => false)) {
            // write the executable path to the cache to avoid `install()` throwing for prerelease versions on LINUX_ARM
            cache.writeExecutablePath(Browser.CHROMEDRIVER, platform, electronVersion, relativeExecutablePath)
            executablePath = await installBuild({
                cacheDir,
                buildId: electronVersion,
                platform,
                browser: Browser.CHROMEDRIVER,
                unpack: true,
                providers: [provider],
                downloadProgressCallback: (downloadedBytes, totalBytes) => downloadProgressCallback('Chromedriver', downloadedBytes, totalBytes)
            }, platform, executablePath, (installCacheDir) => {
                new Cache(installCacheDir).writeExecutablePath(Browser.CHROMEDRIVER, platform, electronVersion, relativeExecutablePath)
            })
        }
        log.info(`Using Chromedriver from Electron v${electronVersion} at ${executablePath}`)
        return { executablePath }
    })
}

async function installChromedriver (cacheDir: string, platform: BrowserPlatform, version: string, buildId: string): Promise<{ executablePath: string }> {
    let executablePath = computeExecutablePath({
        browser: Browser.CHROMEDRIVER,
        buildId,
        platform,
        cacheDir
    })
    const hasChromedriverInstalled = await fsp.access(executablePath).then(() => true, () => false)
    if (!hasChromedriverInstalled) {
        log.info(`Downloading Chromedriver v${buildId}`)
        const chromedriverInstallOpts: InstallOptions & { unpack?: true } = {
            cacheDir,
            buildId,
            platform,
            browser: Browser.CHROMEDRIVER,
            unpack: true,
            baseUrl: getChromedriverCdnUrl(),
            downloadProgressCallback: (downloadedBytes, totalBytes) => downloadProgressCallback('Chromedriver', downloadedBytes, totalBytes)
        }
        let knownBuild = buildId
        if (await canDownload(chromedriverInstallOpts)) {
            executablePath = await installBuild(chromedriverInstallOpts, platform, executablePath)
            log.info(`Download of Chromedriver v${buildId} was successful`)
        } else {
            /**
             * `canDownload` reports false for any failed request, so with a custom CDN
             * this is just as likely a wrong url or rejected credentials as a missing
             * version - name the host so it is clear where to look
             */
            const cdnUrl = getChromedriverCdnUrl()
            log.warn(
                `Chromedriver v${buildId} don't exist, trying to find known good version...` +
                (cdnUrl ? ` (checked ${redactCredentials(cdnUrl)} from CHROMEDRIVER_CDNURL, a failed request is reported the same way as a missing version)` : '')
            )
            /**
             * `stable` has no numeric major. The resolved build id does, and it
             * is the same for every request that shared this install, so the
             * fallback does not depend on whichever raw version started it.
             */
            const fallbackVersion = getMajorVersionFromString(version) || getMajorVersionFromString(buildId)
            knownBuild = await resolveBuildId(Browser.CHROMEDRIVER, platform, fallbackVersion)
            if (knownBuild && knownBuild !== buildId) {
                /**
                 * Two missing patch builds of one major fall back to the same
                 * known-good build. Their original build ids are different keys,
                 * so share the fallback download on the build that is installed.
                 */
                return shareDriverSetup(
                    chromedriverSetupKey(cacheDir, platform, knownBuild),
                    () => installChromedriver(cacheDir, platform, fallbackVersion || knownBuild, knownBuild)
                )
            }
            if (knownBuild) {
                /**
                 * `knownBuild` is `buildId` here: a different one returned above
                 */
                executablePath = await installBuild({ ...chromedriverInstallOpts, buildId: knownBuild }, platform, executablePath)
                log.info(`Download of Chromedriver v${knownBuild} was successful`)
            } else {
                throw new Error(`Couldn't download any known good version from Chromedriver major v${fallbackVersion}, requested full version - v${version}`)
            }
        }
    } else {
        log.info(`Using Chromedriver v${buildId} from cache directory ${cacheDir}`)
    }
    return { executablePath }
}

export function setupGeckodriver (cacheDir: string, driverVersion?: string) {
    return shareDriverSetup(
        `geckodriver:${driverCacheKey(cacheDir)}:${driverVersion ?? ''}`,
        () => downloadGeckodriver(driverVersion, cacheDir)
    )
}

export function setupEdgedriver (cacheDir: string, driverVersion?: string) {
    return shareDriverSetup(
        `edgedriver:${driverCacheKey(cacheDir)}:${driverVersion ?? ''}`,
        () => installEdgedriver(cacheDir, driverVersion)
    )
}

async function installEdgedriver (cacheDir: string, driverVersion?: string) {
    setDefaultEdgedriverCdnUrl()
    const { download: downloadEdgedriver } = await import('edgedriver')
    return downloadEdgedriver(driverVersion, cacheDir)
}

export function generateDefaultPrefs(caps: WebdriverIO.Capabilities) {
    return caps['goog:chromeOptions']?.debuggerAddress
        ? {}
        : { prefs: { 'profile.password_manager_leak_detection': false } }
}
