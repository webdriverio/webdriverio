import fsp from 'node:fs/promises'
import path from 'node:path'
import cp from 'node:child_process'
import { promisify } from 'node:util'

import logger from '@wdio/logger'
import { install, Cache, detectBrowserPlatform, getDownloadUrl, type InstallOptions } from '@puppeteer/browsers'

import { extractZipUsesFaultyYauzl } from './yauzl.js'

const log = logger('webdriver')

/**
 * Node 26 can not unzip with `extract-zip` and a `yauzl` older than 3.3.1, so an OS tool is required there.
 * A retry can not install the tool, so `_install` does not retry this error.
 */
export class MissingUnzipToolError extends Error {
    name = 'MissingUnzipToolError'
}

/**
 * `@puppeteer/browsers` v2 unzips with `extract-zip` and `yauzl` 2. On Node 26 that
 * promise never settles and the extracted folder has no executable (#15608).
 * Like `@puppeteer/browsers` v3, unzip the archive with an OS tool first, so that
 * `install()` finds a complete build folder and only runs its setup.
 * Other archive types (Firefox `.tar.xz`, `.tar.bz2`, `.dmg`, `.exe`) stay with `install()`,
 * as before. Without an OS tool, `install()` unzips with `extract-zip`, as before, unless its
 * `yauzl` is older than 3.3.1: then a clear error is thrown, as `extract-zip` would hang.
 * Only on Node 26 and later: older versions keep `extract-zip`, which works there.
 */
export async function unzipWithOsTool (args: InstallOptions) {
    if (Number(process.versions.node.split('.')[0]) < 26) {
        return
    }

    const platform = args.platform ?? detectBrowserPlatform()
    if (!platform) {
        // `install()` reports the unsupported platform
        return
    }

    // same file name as `install()`, so that it uses the archive downloaded here
    const fileName = decodeURIComponent(getDownloadUrl(args.browser, platform, args.buildId, args.baseUrl).toString()).split('/').pop()
    if (!fileName?.endsWith('.zip')) {
        // `install()` downloads and unpacks it as before, nothing is downloaded here
        return
    }

    const cache = new Cache(args.cacheDir)
    const outputPath = cache.installationDir(args.browser, platform, args.buildId)
    if (await fsp.access(outputPath).then(() => true, () => false)) {
        // installed already, or a partial folder that `install()` reports
        return
    }

    const archivePath = await install({ ...args, platform, unpack: false }).catch(async (err) => {
        // `install()` reuses an archive that exists, so never keep a partial download
        await removeOrWarn(path.join(cache.browserRoot(args.browser), `${args.buildId}-${fileName}`))
        throw err
    })
    // the download progress line is done: clear it before the unzip logs
    log.progress('')

    try {
        await fsp.mkdir(outputPath, { recursive: true })
        const tool = await extractZip(archivePath, outputPath)
        if (tool) {
            log.info(`Unzipped ${args.browser} v${args.buildId} with ${tool}`)
            return
        }
    } catch (err) {
        // never reuse a folder or an archive that failed to unzip
        await removeOrWarn(outputPath)
        await removeOrWarn(archivePath)
        throw err
    }

    await removeOrWarn(outputPath)
    if (!extractZipUsesFaultyYauzl()) {
        // `yauzl` 3.3.1 and later work on Node 26: `install()` unzips the downloaded archive, as before
        log.info(`No unzip tool found, ${args.browser} v${args.buildId} is unzipped with extract-zip`)
        return
    }
    // as `@puppeteer/browsers` 3: never keep the folder or the archive
    await removeOrWarn(archivePath)
    throw new MissingUnzipToolError(
        `No unzip tool found to install ${args.browser} v${args.buildId}. On Node.js 26, install \`unzip\` ` +
        '(Linux, macOS) or `tar.exe`/PowerShell (Windows), or override `yauzl` to ^3.3.1 in your package manager ' +
        '(https://github.com/webdriverio/webdriverio/issues/15608).'
    )
}

async function removeOrWarn (file: string) {
    await fsp.rm(file, { recursive: true, force: true }).catch((err) => {
        log.warn(`Couldn't remove ${file}, the retry can fail: ${err}`)
    })
}

/**
 * Same tools and order as `@puppeteer/browsers` v3.
 * @returns the tool that unzipped the archive, or `undefined` if no tool is installed
 * @throws the error of the first tool that is installed but failed
 */
async function extractZip (archivePath: string, folderPath: string): Promise<string | undefined> {
    const execFile = promisify(cp.execFile)
    const systemRoot = process.env.SystemRoot ?? process.env.SYSTEMROOT ?? 'C:\\Windows'
    // PowerShell joins and parses again all arguments after -Command, which splits paths with spaces
    // no progress bar: Windows PowerShell 5.1 is very slow with it for archives with many files
    const expandArchive = ['-NoProfile', '-NonInteractive', '-Command', "$ProgressPreference = 'SilentlyContinue'; Expand-Archive -LiteralPath $env:WDIO_ZIP_ARCHIVE -DestinationPath $env:WDIO_ZIP_FOLDER -Force"]
    const powershellOptions = { env: { ...process.env, WDIO_ZIP_ARCHIVE: archivePath, WDIO_ZIP_FOLDER: folderPath } }
    const tools: [string, string, string[], cp.ExecFileOptions][] = process.platform === 'win32'
        ? [
            ['tar.exe', `${systemRoot}\\System32\\tar.exe`, ['-xf', archivePath, '-C', folderPath], {}],
            ['powershell.exe', 'powershell.exe', expandArchive, powershellOptions],
            ['pwsh.exe', 'pwsh.exe', expandArchive, powershellOptions]
        ]
        : [['unzip', 'unzip', ['-o', archivePath, '-d', folderPath], {}]]

    let failure: Error | undefined
    for (const [name, file, toolArgs, options] of tools) {
        try {
            await execFile(file, toolArgs, options)
            return name
        } catch (err) {
            const { code, stderr } = err as { code?: string | number, stderr?: string | Buffer }
            if (code === 'ENOENT') {
                continue
            }
            // any other exit code is a failure, as in `@puppeteer/browsers` 3: Info-ZIP exits
            // with 1 also when it skipped files, BusyBox unzip (Alpine) on any error
            log.debug(`${name} failed to unzip ${archivePath}: ${err}`)
            failure ??= new Error(`Failed to unzip ${archivePath} with ${name}: ${stderr?.toString().trim() || (err as Error)?.message || err}`, { cause: err })
        }
    }
    if (failure) {
        throw failure
    }
    return undefined
}
