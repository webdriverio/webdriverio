import os, { platform } from 'node:os'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { mkdir, readdir, unlink } from 'node:fs/promises'
import path from 'node:path'
import cp from 'node:child_process'
import { promisify } from 'node:util'
import stream from 'node:stream'

import got from 'got'
import decamelize from 'decamelize'
import logger from '@wdio/logger'
import { getChromePath } from 'chrome-launcher'
import type { BrowserPlatform } from '@puppeteer/browsers'
import { coerce } from 'semver'

import {
    install, canDownload, resolveBuildId, detectBrowserPlatform, Browser, ChromeReleaseChannel, Cache,
    computeExecutablePath, type InstallOptions
} from '@puppeteer/browsers'
import { download as downloadGeckodriver } from 'geckodriver'
import { download as downloadEdgedriver } from 'edgedriver'
import type { EdgedriverParameters } from 'edgedriver'
import type { Options, Capabilities } from '@wdio/types'

import { DEFAULT_HOSTNAME, DEFAULT_PROTOCOL, DEFAULT_PATH, SUPPORTED_BROWSERNAMES } from '../constants.js'

import extractZip from 'extract-zip'
// @ts-ignore
import tar from 'tar-fs'
// @ts-ignore
import bzip from 'unbzip2-stream'

const log = logger('webdriver')
const EXCLUDED_PARAMS = ['version', 'help']

const pipeline = promisify(stream.pipeline)
const exec = promisify(cp.exec)

export async function downloadFile(url: string, destinationPath: string, progressCallback: (downloadedBytes: number, totalBytes: number) => void
) {
    const downloadStream = got.stream(url)
    const fileWriterStream = fs.createWriteStream(destinationPath)

    progressCallback && downloadStream
        .on('downloadProgress', ({ transferred, total }) =>
            progressCallback(transferred, total))

    return pipeline(downloadStream, fileWriterStream)
}

export async function unpackArchive(archivePath: string, folderPath: string) {

    await mkdir(folderPath, { recursive: true })

    if (archivePath.endsWith('.zip')) {
        await extractZip(archivePath, { dir: folderPath })
    } else if (archivePath.endsWith('.tar.bz2')) {
        await extractTar(archivePath, folderPath)
    } else if (archivePath.endsWith('.dmg')) {
        await installDMG(archivePath, folderPath)
    } else if (archivePath.endsWith('.msi')) {
        await exec(`msiexec /quiet /i "${archivePath}" INSTALL_DIRECTORY_PATH="${folderPath}" TASKBAR_SHORTCUT=false DESKTOP_SHORTCUT=false INSTALL_MAINTENANCE_SERVICE=false`)
    } else if (archivePath.endsWith('.exe')) {
        await exec(`"${archivePath}" /S /InstallDirectoryPath="${folderPath}" /TaskbarShortcut=false /DesktopShortcut=false /StartMenuShortcut=false /PrivateBrowsingShortcut=false /MaintenanceService=false`)
            .catch((err) => {
                console.log(err)
            })
    } else {
        throw new Error(`Unsupported archive format: ${archivePath}`)
    }
}

export function extractTar(tarPath: string, folderPath: string) {
    return new Promise((fulfill, reject) => {
        const tarStream = tar.extract(folderPath)
        tarStream.on('error', reject)
        tarStream.on('finish', fulfill)
        const readStream = fs.createReadStream(tarPath)
        readStream.pipe(bzip()).pipe(tarStream)
    })
}

export async function installDMG(dmgPath: string, folderPath: string) {
    const { stdout } = await exec(`hdiutil attach -nobrowse -noautoopen "${dmgPath}"`)

    const volumes = stdout.match(/\/Volumes\/(.*)/m)
    if (!volumes) {
        throw new Error(`Could not find volume path in ${stdout}`)
    }
    const mountPath = volumes[0]
    let appName

    try {
        const fileNames = await readdir(mountPath)
        appName = fileNames.find(item => {
            return typeof item === 'string' && item.endsWith('.app')
        })
        if (!appName) {
            throw new Error(`Cannot find app in ${mountPath}`)
        }
        const mountedPath = path.join(mountPath, appName)

        await exec(`cp -R "${mountedPath}" "${folderPath}"`)
    } finally {
        await exec(`hdiutil detach "${mountPath}" -quiet`).catch(() => { })
    }

    return appName
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
        downloadProgressCallback: (downloadedBytes, totalBytes) => downloadProgressCallback('Chrome', downloadedBytes, totalBytes)
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

type FF_CHANNELS = 'LATEST_FIREFOX_VERSION'
    | 'LATEST_FIREFOX_DEVEL_VERSION'
    | 'LATEST_FIREFOX_RELEASED_DEVEL_VERSION'
    | 'FIREFOX_DEVEDITION'
    | 'FIREFOX_ESR'
    | 'FIREFOX_ESR_NEXT'
    | 'FIREFOX_NIGHTLY';

async function getLatestVersionsFF() {
    return got
        .get('https://product-details.mozilla.org/1.0/firefox_versions.json')
        .json<Record<FF_CHANNELS, string>>()
        .then(versions => versions)
        .catch(err => {
            throw new Error('Could not retrieve versions: ' + err)
        })
}

async function getFirefoxInfo() {
    return got
        .get('https://product-details.mozilla.org/1.0/firefox.json', { resolveBodyOnly: true })
        .json<{ releases: Record<`firefox-${string}`, FirefoxReleaseInfo> }>()
        .then(data => data.releases)
        .catch(err => { throw new Error(`Could not get Firefox releases information: ${err}`) }
        )
}

async function getLatestVersionFromChannelFF(channel: FF_CHANNELS = 'LATEST_FIREFOX_VERSION') {
    const versions = await getLatestVersionsFF()
    const version = versions[channel]
    if (!version) {
        throw new Error(`Channel ${channel} is not found.`)
    }
    return version
}

export type FirefoxReleaseInfo = {
    build_number: number,
    category: string,
    date: string,
    description: string | null,
    is_security_driven: boolean,
    product: 'firefox',
    version: string
};

export async function setupFirefox(cacheDir: string, caps: Capabilities.Capabilities) {

    const { browserVersion } = caps ?? {}

    if (!browserVersion) {
        // Let Geckodriver deal with it
        return {}
    }

    const cbProgressFirefox = (downloadedBytes: number, totalBytes: number) =>
        downloadProgressCallback('Firefox', downloadedBytes, totalBytes)

    const OS: string = ({ 'win32': 'win', 'darwin': 'osx' }[platform() as string] ?? 'linux')

    const arch = {
        'arm': { 'osx': 'mac' }[OS],
        'arm64': { 'win': 'win64-aarch64', 'osx': 'mac' }[OS],
        'ia32': { 'win': 'win32', 'linux': 'linux-i686' }[OS],
        'x64': { 'win': 'win64', 'osx': 'mac', 'linux': 'linux-x86_64' }[OS]
    }[process.arch as string]

    if (!arch) {
        throw new Error(`Cannot download Firefox for OS ${OS} and ${process.arch}!`)
    }

    const labelChannelMap: Record<string, FF_CHANNELS> = {
        'dev': 'FIREFOX_DEVEDITION',
        'esr': 'FIREFOX_ESR',
        'nightly': 'FIREFOX_NIGHTLY',
        'beta': 'LATEST_FIREFOX_RELEASED_DEVEL_VERSION',
        'stable': 'LATEST_FIREFOX_VERSION',
        'latest': 'LATEST_FIREFOX_VERSION'
    }

    let channel: FF_CHANNELS | undefined = labelChannelMap[browserVersion.toLowerCase()]

    let nonSemanticVersion = channel
        ? await getLatestVersionFromChannelFF(channel)
        : browserVersion

    const parseVersion = (token: string) => {

        const label = Object
            .keys(labelChannelMap)
            .find(label => token.endsWith(label))

        if (label) {
            token = token.substring(0, token.length - label.length)
        }

        const [alpha, beta] = ['a', 'b']
            .map(t => token.split(t).length === 2
                ? token.split(t).pop()
                : undefined)

        // semver removes anything extra of major, minor and patch
        // Safeguards for when versions are specified without minor and patch
        const semanticVersion = coerce(
            `${(alpha || beta)
                ? token
                : token.replace(/[^.\d]/g, '')
            }.0.0`,
            { loose: true }
        )

        return { ...semanticVersion ?? {}, alpha, beta, label }
    }

    let semver = parseVersion(nonSemanticVersion)

    channel = semver.label === 'dev' ? 'FIREFOX_DEVEDITION' : channel
    channel = semver.label === 'esr' ? 'FIREFOX_ESR' : channel
    channel = semver.alpha ? 'FIREFOX_NIGHTLY' : channel

    if (!channel) {

        type VersionAndInfo = [string?, FirefoxReleaseInfo?];
        const versions = await getFirefoxInfo()

        const [oficialVersion]: VersionAndInfo = Object
            .entries(versions)
            .map(([version, info]) => [version.substring('firefox-'.length), info] as VersionAndInfo)
            .find(([oficialVersion]) => oficialVersion === nonSemanticVersion) as VersionAndInfo

        if (!oficialVersion) {
            throw new Error(`No Firefox version could be found from "${browserVersion}"`)
        }

        nonSemanticVersion = oficialVersion
    }

    semver = parseVersion(nonSemanticVersion)

    const { major, minor, patch, alpha, beta } = semver

    if (!major) {
        throw new Error(`No Firefox version could be processed from "${browserVersion}"`)
    }

    const locale = 'en-US'

    const suffix = alpha
        ? `a${alpha}`
        : beta ? `b${beta}` : undefined

    let mozVersion = `${major}.${minor}${suffix ?? `.${patch}`}`
    channel === 'FIREFOX_ESR' && (mozVersion += 'esr')

    // Set proper version in capabilities
    // Geckodriver does not like 0-based patch versions
    caps.browserVersion = `${major}.${minor}${patch ? `.${patch}` : ''}`

    const dlURL = {

        baseUrl: {
            'FIREFOX_NIGHTLY': 'https://download.cdn.mozilla.net/pub',
        }[channel as string] ?? 'https://ftp.mozilla.org/pub',

        path: {
            'FIREFOX_NIGHTLY': 'firefox/nightly/latest-mozilla-central',
            'FIREFOX_DEVEDITION': `devedition/releases/${mozVersion}/${arch}/${locale}`,
        }[channel as string] ?? `firefox/releases/${mozVersion}/${arch}/${locale}`,

        filename: {
            'FIREFOX_NIGHTLY': `firefox-${mozVersion}.${locale}.${arch}`,
        }[channel as string] ?? {
            'osx': `Firefox ${mozVersion}`,
            'win': `Firefox Setup ${mozVersion}`,
            'linux': `firefox-${mozVersion}`
        }[OS],

        ext: {
            'osx': '.dmg',
            'win': channel === 'FIREFOX_NIGHTLY'
                ? '.installer.exe'
                : '.msi',
            'linux': '.tar.bz2'
        }[OS],

        get build() {
            return [dlURL.baseUrl, dlURL.path, dlURL.filename].join('/') + dlURL.ext
        }
    }

    const url = dlURL.build

    log.info(`Setting up Firefox v${mozVersion}`)

    const fileName: string = url.toString().split('/').pop() ?? ''

    const cache = new Cache(cacheDir)
    const browserRoot = cache.browserRoot(Browser.FIREFOX)
    const archivePath = path.join(
        browserRoot,
        `${mozVersion}${path.extname(fileName)}`
    )
    if (!fs.existsSync(browserRoot)) {
        fs.mkdirSync(browserRoot, { recursive: true })
    }

    const outputPath = cache.installationDir(
        Browser.FIREFOX,
        arch as BrowserPlatform,
        channel === 'FIREFOX_DEVEDITION'
            ? `${mozVersion}dev`
            : mozVersion
    )
    fs.mkdirSync(outputPath, { recursive: true })

    const getExecPath = (OS: string, outputPath: string) => {

        let fileName = {
            'win': 'firefox.exe',
            'linux': 'firefox',
        }[OS]

        if (OS === 'osx') {
            fileName = fs.readdirSync(outputPath).find(f => f.endsWith('.app'))
        }

        if (!fileName) {
            return undefined
        }

        return {
            'osx': path.join(outputPath, fileName, 'Contents', 'MacOS', 'firefox-bin'),
        }[OS] ?? path.join(outputPath, fileName)
    }

    if (fs.existsSync(outputPath)) {

        const executablePath = getExecPath(OS, outputPath)
        const execFound = executablePath && fs.existsSync(executablePath)

        !execFound && log.info(`Could not find Firefox executable in "${outputPath}"`)

        if (execFound) {
            const props = { executablePath, buildId: channel, platform }

            let shouldDownload = false

            if (channel === 'FIREFOX_NIGHTLY') {

                // Check latest nightly, updates often
                shouldDownload = await got.head(url)
                    .then(async res => {

                        const header = res.headers['last-modified']
                        const lastModified: number = new Date(header ?? NaN).valueOf()

                        return (!!header && !Number.isNaN(lastModified)) && await fsp
                            .lstat(executablePath)
                            .then(exec => exec.birthtimeMs < lastModified)
                    })
                    .catch(err => { log.error(err); return false })
            }

            if (!shouldDownload){
                return props
            }
        }
    }

    await downloadFile(url, archivePath, cbProgressFirefox)

    await unpackArchive(archivePath, outputPath)

    if (fs.existsSync(archivePath)) {
        await unlink(archivePath).catch(err => log.error(err))
    }

    const executablePath = getExecPath(OS, outputPath)

    return { executablePath, buildId: channel, platform: arch }
}

export function getCacheDir(options: Pick<Options.WebDriver, 'cacheDir'>, caps: Capabilities.Capabilities) {
    const driverOptions: { cacheDir?: string } = (
        caps['wdio:chromedriverOptions'] ||
        caps['wdio:chromedriverOptions'] ||
        caps['wdio:chromedriverOptions'] ||
        caps['wdio:chromedriverOptions'] ||
        {}
    )
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

export function setupGeckodriver(cacheDir: string, driverVersion?: string) {
    return downloadGeckodriver(driverVersion, cacheDir)
}

export function setupEdgedriver(cacheDir: string, driverVersion?: string) {
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

export function isChrome(browserName?: string) {
    return Boolean(browserName && SUPPORTED_BROWSERNAMES.chrome.includes(browserName.toLowerCase()))
}
export function isSafari(browserName?: string) {
    return Boolean(browserName && SUPPORTED_BROWSERNAMES.safari.includes(browserName.toLowerCase()))
}
export function isFirefox(browserName?: string) {
    return Boolean(browserName && SUPPORTED_BROWSERNAMES.firefox.includes(browserName.toLowerCase()))
}
export function isEdge(browserName?: string) {
    return Boolean(browserName && SUPPORTED_BROWSERNAMES.edge.includes(browserName.toLowerCase()))
}
