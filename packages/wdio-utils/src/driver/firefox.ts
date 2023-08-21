import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'

import { Cache, Browser } from '@puppeteer/browsers'
import got from 'got'
import logger from '@wdio/logger'
import { coerce } from 'semver'
import { download as downloadGeckodriver } from 'geckodriver'

import { logDownload, downloadFile, unpackArchive } from './utils.js'

import type { BrowserPlatform } from '@puppeteer/browsers'
import type { Capabilities } from '@wdio/types'

const log = logger('@wdio/utils')

export type FF_CHANNELS = 'LATEST_FIREFOX_VERSION'
    | 'LATEST_FIREFOX_DEVEL_VERSION'
    | 'LATEST_FIREFOX_RELEASED_DEVEL_VERSION'
    | 'FIREFOX_DEVEDITION'
    | 'FIREFOX_ESR'
    | 'FIREFOX_ESR_NEXT'
    | 'FIREFOX_NIGHTLY';

async function getLatestVersions() {
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

async function getLatestVersion(channel: FF_CHANNELS = 'LATEST_FIREFOX_VERSION') {
    const versions = await getLatestVersions()
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

export function setupGeckodriver(cacheDir: string, driverVersion?: string) {
    return downloadGeckodriver(driverVersion, cacheDir)
}

export async function setupFirefox(cacheDir: string, caps: Capabilities.Capabilities) {

    const { browserVersion } = caps ?? {}

    if (!browserVersion) {
        // Let Geckodriver deal with it
        return {}
    }

    const OS = ({
        win32: 'win',
        darwin: 'osx'
    }[process.platform as string] ?? 'linux') as 'win' | 'osx' | 'linux'

    const arch = (({
        arm: { osx: 'mac' },
        arm64: { win: 'win64-aarch64', osx: 'mac' },
        ia32: { win: 'win32', linux: 'linux-i686' },
        x64: { win: 'win64', osx: 'mac', linux: 'linux-x86_64' },
    }[process.arch as string]) ?? {})[OS]

    if (!arch) {
        throw new Error(`Cannot download Firefox for OS ${OS} and ${process.arch}!`)
    }

    const labelChannelMap: Record<string, FF_CHANNELS> = {
        dev: 'FIREFOX_DEVEDITION',
        esr: 'FIREFOX_ESR',
        nightly: 'FIREFOX_NIGHTLY',
        beta: 'LATEST_FIREFOX_RELEASED_DEVEL_VERSION',
        stable: 'LATEST_FIREFOX_VERSION',
        latest: 'LATEST_FIREFOX_VERSION'
    }

    let channel: FF_CHANNELS | undefined = labelChannelMap[browserVersion.toLowerCase()]

    let nonSemanticVersion = channel
        ? await getLatestVersion(channel)
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
            .find(([oficialVersion]) => oficialVersion && oficialVersion === nonSemanticVersion) as VersionAndInfo
            ?? []

        if (!oficialVersion) {
            log.error(`No Firefox version could be found from "${browserVersion}"`)
            return {}
        }

        nonSemanticVersion = oficialVersion
    }

    semver = parseVersion(nonSemanticVersion)

    const { major, minor, patch, alpha, beta } = semver

    if (!major) {
        log.error(`No Firefox version could be found from "${browserVersion}"`)
        return {}
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
            osx: `Firefox ${mozVersion}`,
            win: `Firefox Setup ${mozVersion}`,
            linux: `firefox-${mozVersion}`
        }[OS],

        ext: {
            osx: '.dmg',
            win: channel === 'FIREFOX_NIGHTLY'
                ? '.installer.exe'
                : '.msi',
            linux: '.tar.bz2'
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

    const getExecPath = (OS: 'win' | 'linux' | 'osx', outputPath: string, channel: string = '') => {

        const fileName = OS !== 'osx'
            ? { win: 'firefox.exe', linux: 'firefox' }[OS]
            : fs
                .readdirSync(outputPath)
                .find(f => f.endsWith('.app')) ?? {

                FIREFOX_DEVEDITION: 'Firefox Developer Edition.app',
                FIREFOX_NIGHTLY: 'Firefox Nightly.app'

            }[channel] ?? 'Firefox.app'

        if (!fileName) {
            return undefined
        }

        return {
            'osx': path.join(
                outputPath,
                fileName,
                'Contents', 'MacOS', 'firefox-bin'
            ),
        }[OS as string] ?? path.join(outputPath, fileName)
    }

    if (fs.existsSync(outputPath)) {

        const executablePath = getExecPath(OS, outputPath)
        const execFound = executablePath && fs.existsSync(executablePath)

        !execFound && log.info(`Could not find Firefox executable in "${outputPath}"`)

        if (execFound) {
            const props = { executablePath, buildId: channel, platform: arch }

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

            if (!shouldDownload) {
                return props
            }
        }
    }

    await downloadFile(
        url, archivePath,
        ({ transferred, total }) => logDownload('Firefox', transferred, total)
    )

    await unpackArchive(archivePath, outputPath)

    if (fs.existsSync(archivePath)) {
        await fsp.unlink(archivePath).catch(err => log.error(err))
    }

    const executablePath = getExecPath(OS, outputPath)

    return { executablePath, buildId: channel, platform: arch }
}