import os from 'node:os'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import cp from 'node:child_process'

import decamelize from 'decamelize'
import logger from '@wdio/logger'
import {
    install, canDownload, resolveBuildId, detectBrowserPlatform, Browser, ChromeReleaseChannel,
    computeExecutablePath, type InstallOptions
} from '@puppeteer/browsers'
import { download as downloadGeckodriver } from 'geckodriver'
import { locateChrome, locateFirefox, locateApp } from 'locate-app'
import type { EdgedriverParameters } from 'edgedriver'
import type { Options } from '@wdio/types'

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
 * @param {string} message - a log line or error message that may contain urls
 * @returns the message with `user:password@` stripped from any url it contains
 */
function redactCredentials (message: string) {
    return message.replace(/([a-zA-Z][\w+.-]{0,30}:\/\/)[^/\s?#]+@/g, '$1')
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
    await install(args).catch((err) => {
        /**
         * a rejection is not guaranteed to be an Error, so never assume a writable
         * `message` and never let `new Error()` stringify an object into `[object Object]`
         */
        const details = redactCredentials(`Failed downloading ${args.browser} v${args.buildId} using ${JSON.stringify(args)}: ${describeRejection(err)}`)
        if (retry) {
            throw new Error(details)
        }
        log.error(`${details}, retrying ...`)
        return _install(args, true)
    })
    log.progress('')
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
    return driverOptions.cacheDir || options.cacheDir || process.env.WEBDRIVER_CACHE_DIR || os.tmpdir()
}

export function getMajorVersionFromString(fullVersion:string) {
    let prefix
    if (fullVersion) {
        prefix = fullVersion.match(/^[+-]?([0-9]+)/)
    }
    return prefix && prefix.length > 0 ? prefix[0] : ''
}

export async function setupChromedriver (cacheDir: string, driverVersion?: string) {
    const platform = detectBrowserPlatform()
    if (!platform) {
        throw new Error('The current platform is not supported.')
    }
    const version = driverVersion || getBuildIdByChromePath(await locateChromeSafely()) || ChromeReleaseChannel.STABLE
    const buildId = await resolveBuildId(Browser.CHROMEDRIVER, platform, version)
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
            await _install({ ...chromedriverInstallOpts, buildId })
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
            knownBuild = await resolveBuildId(Browser.CHROMEDRIVER, platform, getMajorVersionFromString(version))
            if (knownBuild) {
                await _install({ ...chromedriverInstallOpts, buildId: knownBuild })
                log.info(`Download of Chromedriver v${knownBuild} was successful`)
            } else {
                throw new Error(`Couldn't download any known good version from Chromedriver major v${getMajorVersionFromString(version)}, requested full version - v${version}`)
            }
        }
        executablePath = computeExecutablePath({
            browser: Browser.CHROMEDRIVER,
            buildId: knownBuild,
            platform,
            cacheDir
        })
    } else {
        log.info(`Using Chromedriver v${buildId} from cache directory ${cacheDir}`)
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
