import fsp from 'node:fs/promises'
import cp from 'node:child_process'
import { promisify } from 'node:util'

import logger from '@wdio/logger'
import { install, Cache, detectBrowserPlatform, type InstallOptions } from '@puppeteer/browsers'

const log = logger('webdriver')

/**
 * `@puppeteer/browsers` v2 unzips with `extract-zip` and `yauzl` 2. On Node 26 that
 * promise never settles and the extracted folder has no executable (#15608).
 * Like `@puppeteer/browsers` v3, unzip the archive with an OS tool first, so that
 * `install()` finds a complete build folder and only runs its setup.
 * Without an OS tool, `install()` unpacks the archive with `extract-zip` as before.
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

    const outputPath = new Cache(args.cacheDir).installationDir(args.browser, platform, args.buildId)
    if (await fsp.access(outputPath).then(() => true, () => false)) {
        // installed already, or a partial folder that `install()` reports
        return
    }

    const archivePath = await install({ ...args, platform, unpack: false })
    if (!archivePath.endsWith('.zip')) {
        // `install()` unpacks other archive types from the downloaded file
        return
    }

    try {
        await fsp.mkdir(outputPath, { recursive: true })
        const tool = await extractZip(archivePath, outputPath)
        if (tool) {
            log.info(`Unzipped ${args.browser} v${args.buildId} with ${tool}`)
            return
        }
    } catch (err) {
        // never reuse a folder or an archive that failed to unzip
        await fsp.rm(outputPath, { recursive: true, force: true })
        await fsp.rm(archivePath, { force: true })
        throw err
    }

    await fsp.rm(outputPath, { recursive: true, force: true })
    log.warn(
        `No unzip tool found, ${args.browser} v${args.buildId} is unzipped with extract-zip, which fails on Node 26. ` +
        'Install `unzip` (or `tar.exe`/PowerShell on Windows) to fix this.'
    )
}

/**
 * Same tools and order as `@puppeteer/browsers` v3.
 * @returns the tool that unzipped the archive, or `undefined` if no tool is installed
 */
async function extractZip (archivePath: string, folderPath: string): Promise<string | undefined> {
    const execFile = promisify(cp.execFile)
    try {
        if (process.platform !== 'win32') {
            await execFile('unzip', ['-o', archivePath, '-d', folderPath])
            return 'unzip'
        }

        const systemRoot = process.env.SystemRoot ?? process.env.SYSTEMROOT ?? 'C:\\Windows'
        try {
            await execFile(`${systemRoot}\\System32\\tar.exe`, ['-xf', archivePath, '-C', folderPath])
            return 'tar.exe'
        } catch (err) {
            log.debug(`tar.exe failed to unzip ${archivePath}: ${err}`)
        }
        const expandArchive = ['-NoProfile', '-NonInteractive', '-Command', '& { Expand-Archive -LiteralPath $args[0] -DestinationPath $args[1] -Force }', archivePath, folderPath]
        try {
            await execFile('powershell.exe', expandArchive)
            return 'powershell.exe'
        } catch (err) {
            log.debug(`powershell.exe failed to unzip ${archivePath}: ${err}`)
        }
        await execFile('pwsh.exe', expandArchive)
        return 'pwsh.exe'
    } catch (err) {
        if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
            return undefined
        }
        const stderr = (err as { stderr?: string })?.stderr?.toString()
        throw new Error(`Failed to unzip ${archivePath}: ${stderr || (err as Error)?.message || err}`)
    }
}
