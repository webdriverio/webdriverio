import os from 'node:os'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import cp from 'node:child_process'
import { promisify } from 'node:util'
import stream from 'node:stream'

import type { Progress } from 'got'
import got from 'got'
import decamelize from 'decamelize'
import logger from '@wdio/logger'

import extractZip from 'extract-zip'
// @ts-ignore
import tar from 'tar-fs'
// @ts-ignore
import bzip from 'unbzip2-stream'

import { DEFAULT_HOSTNAME, DEFAULT_PROTOCOL, DEFAULT_PATH, SUPPORTED_BROWSERNAMES } from '../constants.js'

import type { Capabilities, Options } from '@wdio/types'
import type { ChromedriverParameters } from './chrome.js'
import type { EdgedriverParameters } from './edge.js'

const log = logger('@wdio/utils')
const EXCLUDED_PARAMS = ['version', 'help']

const pipeline = promisify(stream.pipeline)
const exec = promisify(cp.exec)

export function getCacheDir(
    options: Pick<Options.WebDriver, 'cacheDir'>,
    driverOpts: Capabilities.WebdriverIOCapabilities[keyof Omit<Capabilities.WebdriverIOCapabilities, 'wdio:safaridriverOptions'>] = {},
) {
    const driverOptions: { cacheDir?: string } = driverOpts
    return driverOptions.cacheDir || options.cacheDir || os.tmpdir()
}

export async function downloadFile(
    url: string,
    destinationPath: string,
    progressCb: (p: Progress) => any
) {
    const downloadStream = got.stream(url)
    const fileWriterStream = fs.createWriteStream(destinationPath)

    progressCb && downloadStream.on('downloadProgress', progressCb)

    return pipeline(downloadStream, fileWriterStream)
}

export async function unpackArchive(archivePath: string, folderPath: string) {

    const ext = path.extname(archivePath)

    await fsp.mkdir(folderPath, { recursive: true })

    let unpack = {
        get zip(){ return extractZip(archivePath, { dir: folderPath }) },
        get tar(){ return extractTar(archivePath, folderPath) },
        get bz2(){ return this.tar },
        get dmg(){ return installDMG(archivePath, folderPath) },
        get msi(){
            return exec([
                'msiexec',
                '/quiet',
                '/i',
                `"${archivePath}"`,
                `INSTALL_DIRECTORY_PATH="${folderPath}"`,
                'TASKBAR_SHORTCUT=false',
                'DESKTOP_SHORTCUT=false',
                'INSTALL_MAINTENANCE_SERVICE=false'
            ].join(' '))
        },
        get exe(){
            return exec([
                `"${archivePath}"`,
                '/S',
                `/InstallDirectoryPath="${folderPath}"`,
                '/TaskbarShortcut=false',
                '/DesktopShortcut=false',
                '/StartMenuShortcut=false',
                '/PrivateBrowsingShortcut=false',
                '/MaintenanceService=false'
            ].join(' '))
        }
    }[ext]

    unpack ??= Promise.reject<void>(`Unsupported archive format: ${archivePath}`)

    return unpack.catch((err) => log.error(err))
}

export function extractTar(tarPath: string, folderPath: string) {
    return new Promise<void>((fulfill, reject) => {
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
        const fileNames = await fsp.readdir(mountPath)
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

export function parseParams(params: ChromedriverParameters | EdgedriverParameters) {
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

let lastTimeCalled = Date.now()
export const logDownload = (artifact: string, downloadedBytes: number, totalBytes: number = downloadedBytes) => {
    if (Date.now() - lastTimeCalled < 1000) {
        return
    }
    const percentage = ((downloadedBytes / totalBytes) * 100).toFixed(2)
    log.info(`Downloading ${artifact} ${percentage}%`)
    lastTimeCalled = Date.now()
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
