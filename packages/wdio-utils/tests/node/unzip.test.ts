import path from 'node:path'
import fsp from 'node:fs/promises'
import cp from 'node:child_process'
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { install, getDownloadUrl } from '@puppeteer/browsers'

import { MissingUnzipToolError, unzipWithOsTool } from '../../src/node/unzip.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
const { logMock } = await import(path.join(process.cwd(), '__mocks__', '@wdio/logger')) as { logMock: Record<string, Mock> }

vi.mock('node:fs/promises', () => ({
    default: {
        access: vi.fn(),
        mkdir: vi.fn(),
        rm: vi.fn()
    }
}))

vi.mock('node:child_process', () => ({
    default: { execFile: vi.fn() }
}))

vi.mock('@puppeteer/browsers', () => ({
    Cache: vi.fn(function () {
        return {
            installationDir: () => '/cache/chromedriver/linux-133.0.6943.141',
            browserRoot: () => '/cache/chromedriver'
        }
    }),
    detectBrowserPlatform: vi.fn().mockReturnValue('linux'),
    getDownloadUrl: vi.fn(),
    install: vi.fn()
}))

const outputPath = '/cache/chromedriver/linux-133.0.6943.141'
const archivePath = '/cache/chromedriver/133.0.6943.141-chromedriver-linux64.zip'
const chromedriverUrl = 'https://storage.googleapis.com/chrome-for-testing-public/133.0.6943.141/linux64/chromedriver-linux64.zip'
const args = { cacheDir: '/cache', browser: 'chromedriver', buildId: '133.0.6943.141' } as Parameters<typeof unzipWithOsTool>[0]

type ExecFileResult = Error & { code?: string | number, stderr?: string } | undefined
function execFileResults (results: Record<string, ExecFileResult>) {
    vi.mocked(cp.execFile).mockImplementation(((file: string, _args: string[], _options: unknown, callback: (err?: Error | null) => void) => {
        callback(results[file] ?? null)
    }) as never)
}

function exitError (code: number, stderr: string) {
    return Object.assign(new Error(`Command failed with exit code ${code}`), { code, stderr })
}

function errnoError (code: string) {
    return Object.assign(new Error(code), { code })
}

function stubProcess (key: 'platform' | 'version', value: string) {
    const target = key === 'version' ? process.versions : process
    const name = key === 'version' ? 'node' : 'platform'
    const original = Object.getOwnPropertyDescriptor(target, name)!
    Object.defineProperty(target, name, { ...original, value })
    return () => Object.defineProperty(target, name, original)
}

describe('unzipWithOsTool', () => {
    let restore: (() => void)[] = []

    beforeEach(() => {
        vi.mocked(fsp.access).mockReset().mockRejectedValue(errnoError('ENOENT'))
        vi.mocked(fsp.mkdir).mockReset().mockResolvedValue(undefined)
        vi.mocked(fsp.rm).mockReset().mockResolvedValue(undefined)
        vi.mocked(install).mockReset().mockResolvedValue(archivePath as never)
        vi.mocked(getDownloadUrl).mockReset().mockReturnValue(new URL(chromedriverUrl))
        vi.mocked(cp.execFile).mockReset()
        logMock.info.mockClear()
        logMock.warn.mockClear()
        restore = [stubProcess('platform', 'linux'), stubProcess('version', '26.9.0')]
    })

    afterEach(() => {
        // restore the last stub first: it saved the value of the stub before it
        restore.reverse().forEach((fn) => fn())
    })

    it('unzips the downloaded archive with unzip into the build folder', async () => {
        execFileResults({})

        await unzipWithOsTool(args)

        expect(install).toHaveBeenCalledWith({ ...args, platform: 'linux', unpack: false })
        expect(fsp.mkdir).toHaveBeenCalledWith(outputPath, { recursive: true })
        expect(cp.execFile).toHaveBeenCalledWith('unzip', ['-o', archivePath, '-d', outputPath], {}, expect.any(Function))
        expect(fsp.rm).not.toHaveBeenCalled()
        expect(logMock.info).toHaveBeenCalledWith('Unzipped chromedriver v133.0.6943.141 with unzip')
    })

    it('does nothing when the build folder exists', async () => {
        vi.mocked(fsp.access).mockResolvedValue(undefined)

        await unzipWithOsTool(args)

        expect(install).not.toHaveBeenCalled()
        expect(cp.execFile).not.toHaveBeenCalled()
    })

    /**
     * only zip archives go to the OS tool; for the other types nothing is
     * downloaded here, so `install()` downloads and unpacks them once, as before
     */
    it.each([
        ['Firefox stable, Linux', 'https://archive.mozilla.org/pub/firefox/releases/157.0/linux-x86_64/en-US/firefox-157.0.tar.xz'],
        ['Firefox < 135, Linux', 'https://archive.mozilla.org/pub/firefox/releases/134.0/linux-x86_64/en-US/firefox-134.0.tar.bz2'],
        ['Firefox, macOS', 'https://archive.mozilla.org/pub/firefox/releases/157.0/mac/en-US/Firefox%20157.0.dmg'],
        ['Firefox stable, Windows', 'https://archive.mozilla.org/pub/firefox/releases/157.0/win64/en-US/Firefox%20Setup%20157.0.exe']
    ])('leaves %s to install() without a download', async (_, url) => {
        vi.mocked(getDownloadUrl).mockReturnValue(new URL(url))

        await unzipWithOsTool(args)

        expect(install).not.toHaveBeenCalled()
        expect(cp.execFile).not.toHaveBeenCalled()
        expect(fsp.mkdir).not.toHaveBeenCalled()
    })

    it.each([
        ['Chrome', 'https://storage.googleapis.com/chrome-for-testing-public/133.0.6943.141/linux64/chrome-linux64.zip'],
        ['Chromedriver', chromedriverUrl],
        ['Firefox Nightly, Windows', 'https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central/firefox-158.0a1.en-US.win64.zip']
    ])('unzips %s with the OS tool', async (_, url) => {
        vi.mocked(getDownloadUrl).mockReturnValue(new URL(url))
        execFileResults({})

        await unzipWithOsTool(args)

        expect(install).toHaveBeenCalledWith(expect.objectContaining({ unpack: false }))
        expect(cp.execFile).toHaveBeenCalledWith('unzip', ['-o', archivePath, '-d', outputPath], {}, expect.any(Function))
    })

    it('reads the archive type from the custom download host', async () => {
        execFileResults({})

        await unzipWithOsTool({ ...args, baseUrl: 'https://mirror.example.com/chrome' })

        expect(getDownloadUrl).toHaveBeenCalledWith('chromedriver', 'linux', '133.0.6943.141', 'https://mirror.example.com/chrome')
    })

    it('removes a partial archive and throws when the download fails', async () => {
        vi.mocked(install).mockRejectedValue(new Error('ENOSPC: no space left on device'))

        await expect(unzipWithOsTool(args)).rejects.toThrow('ENOSPC: no space left on device')

        expect(fsp.rm).toHaveBeenCalledWith(archivePath, { recursive: true, force: true })
        expect(cp.execFile).not.toHaveBeenCalled()
    })

    it('does nothing before Node 26, where extract-zip works', async () => {
        restore.push(stubProcess('version', '24.15.0'))

        await unzipWithOsTool(args)

        expect(getDownloadUrl).not.toHaveBeenCalled()
        expect(install).not.toHaveBeenCalled()
        expect(cp.execFile).not.toHaveBeenCalled()
    })

    /**
     * extract-zip never settles on Node 26, so no fallback to it: a clear error, and no
     * folder or archive is kept, as in `@puppeteer/browsers` 3
     */
    it('throws a clear error and removes the folder and the archive when unzip is not installed', async () => {
        execFileResults({ unzip: errnoError('ENOENT') })

        const error = await unzipWithOsTool(args).catch((err) => err)

        expect(error).toBeInstanceOf(MissingUnzipToolError)
        expect(error.message).toContain('No unzip tool found to install chromedriver v133.0.6943.141. WebdriverIO v9 on Node.js 26 and later requires one')
        expect(error.message).toContain('apt-get install unzip')
        expect(fsp.rm).toHaveBeenCalledTimes(2)
        expect(fsp.rm).toHaveBeenCalledWith(outputPath, { recursive: true, force: true })
        expect(fsp.rm).toHaveBeenCalledWith(archivePath, { recursive: true, force: true })
    })

    it('removes the build folder and the archive when unzip fails, and keeps the tool error as cause', async () => {
        const toolError = exitError(9, 'End-of-central-directory signature not found')
        execFileResults({ unzip: toolError })

        const error = await unzipWithOsTool(args).catch((err) => err)

        expect(error.message).toBe(`Failed to unzip ${archivePath} with unzip: End-of-central-directory signature not found`)
        expect(error.cause).toBe(toolError)

        expect(fsp.rm).toHaveBeenCalledWith(outputPath, { recursive: true, force: true })
        expect(fsp.rm).toHaveBeenCalledWith(archivePath, { recursive: true, force: true })
    })

    it('keeps the unzip error and warns when the cleanup fails', async () => {
        execFileResults({ unzip: exitError(9, 'End-of-central-directory signature not found') })
        vi.mocked(fsp.rm).mockRejectedValueOnce(new Error('EBUSY: resource busy or locked'))

        await expect(unzipWithOsTool(args)).rejects.toThrow('End-of-central-directory signature not found')

        expect(logMock.warn).toHaveBeenCalledWith(`Couldn't remove ${outputPath}, the retry can fail: Error: EBUSY: resource busy or locked`)
        expect(fsp.rm).toHaveBeenCalledWith(archivePath, { recursive: true, force: true })
    })

    /**
     * as in `@puppeteer/browsers` 3: Info-ZIP exits with 1 also when it skipped files
     * (unsupported compression or encryption), BusyBox unzip (Alpine) on any error
     */
    it.each([
        ['an Info-ZIP warning', 'warning: 4 extra bytes at beginning or within zipfile'],
        ['a BusyBox error', 'unzip: short read']
    ])('treats unzip exit code 1 with %s as a failure', async (_, stderr) => {
        execFileResults({ unzip: exitError(1, stderr) })

        await expect(unzipWithOsTool(args)).rejects.toThrow(`Failed to unzip ${archivePath} with unzip: ${stderr}`)

        expect(fsp.rm).toHaveBeenCalledWith(outputPath, { recursive: true, force: true })
        expect(fsp.rm).toHaveBeenCalledWith(archivePath, { recursive: true, force: true })
    })

    it('clears the download progress line before the unzip logs', async () => {
        execFileResults({})
        logMock.progress.mockClear()

        await unzipWithOsTool(args)

        expect(logMock.progress).toHaveBeenCalledWith('')
        expect(logMock.progress.mock.invocationCallOrder[0]).toBeLessThan(logMock.info.mock.invocationCallOrder.at(-1)!)
    })

    describe('on Windows', () => {
        beforeEach(() => {
            restore.push(stubProcess('platform', 'win32'))
            vi.stubEnv('SystemRoot', 'C:\\Windows')
        })

        afterEach(() => {
            vi.unstubAllEnvs()
        })

        it('unzips with tar.exe', async () => {
            execFileResults({})

            await unzipWithOsTool(args)

            expect(cp.execFile).toHaveBeenCalledTimes(1)
            expect(cp.execFile).toHaveBeenCalledWith('C:\\Windows\\System32\\tar.exe', ['-xf', archivePath, '-C', outputPath], {}, expect.any(Function))
        })

        /**
         * PowerShell joins and parses again all arguments after -Command, so the
         * paths go in env vars: a cache dir like `C:\\Users\\John Doe\\...` has a space
         */
        it('tries PowerShell when tar.exe fails, with the paths in env vars', async () => {
            execFileResults({ 'C:\\Windows\\System32\\tar.exe': exitError(1, 'tar failed') })

            await unzipWithOsTool(args)

            expect(cp.execFile).toHaveBeenCalledTimes(2)
            const [file, toolArgs, options] = vi.mocked(cp.execFile).mock.lastCall as unknown as [string, string[], { env: Record<string, string> }]
            expect(file).toBe('powershell.exe')
            expect(toolArgs).not.toContain(archivePath)
            expect(toolArgs.at(-1)).toBe("$ProgressPreference = 'SilentlyContinue'; Expand-Archive -LiteralPath $env:WDIO_ZIP_ARCHIVE -DestinationPath $env:WDIO_ZIP_FOLDER -Force")
            expect(options.env).toEqual(expect.objectContaining({ WDIO_ZIP_ARCHIVE: archivePath, WDIO_ZIP_FOLDER: outputPath }))
            expect(logMock.info).toHaveBeenCalledWith('Unzipped chromedriver v133.0.6943.141 with powershell.exe')
        })

        it('throws the first real tool error when the other tools are missing', async () => {
            execFileResults({
                'C:\\Windows\\System32\\tar.exe': errnoError('ENOENT'),
                'powershell.exe': exitError(1, 'Expand-Archive : The archive file is corrupt'),
                'pwsh.exe': errnoError('ENOENT')
            })

            await expect(unzipWithOsTool(args)).rejects.toThrow(`Failed to unzip ${archivePath} with powershell.exe: Expand-Archive : The archive file is corrupt`)

            expect(fsp.rm).toHaveBeenCalledWith(archivePath, { recursive: true, force: true })
            expect(logMock.warn).not.toHaveBeenCalledWith(expect.stringContaining('No unzip tool found'))
        })

        it('throws a clear error when no tool is installed', async () => {
            execFileResults({
                'C:\\Windows\\System32\\tar.exe': errnoError('ENOENT'),
                'powershell.exe': errnoError('ENOENT'),
                'pwsh.exe': errnoError('ENOENT')
            })

            await expect(unzipWithOsTool(args)).rejects.toBeInstanceOf(MissingUnzipToolError)

            expect(cp.execFile).toHaveBeenLastCalledWith('pwsh.exe', expect.any(Array), expect.any(Object), expect.any(Function))
            expect(fsp.rm).toHaveBeenCalledWith(outputPath, { recursive: true, force: true })
        })
    })
})
