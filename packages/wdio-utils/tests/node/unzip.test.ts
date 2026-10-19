import path from 'node:path'
import fsp from 'node:fs/promises'
import cp from 'node:child_process'
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { install } from '@puppeteer/browsers'

import { unzipWithOsTool } from '../../src/node/unzip.js'

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
        return { installationDir: () => '/cache/chromedriver/linux-133.0.6943.141' }
    }),
    detectBrowserPlatform: vi.fn().mockReturnValue('linux'),
    install: vi.fn()
}))

const outputPath = '/cache/chromedriver/linux-133.0.6943.141'
const archivePath = '/cache/chromedriver/133.0.6943.141-chromedriver-linux64.zip'
const args = { cacheDir: '/cache', browser: 'chromedriver', buildId: '133.0.6943.141' } as Parameters<typeof unzipWithOsTool>[0]

type ExecFileResult = Error & { code?: string, stderr?: string } | undefined
function execFileResults (results: Record<string, ExecFileResult>) {
    vi.mocked(cp.execFile).mockImplementation(((file: string, _args: string[], callback: (err?: Error | null) => void) => {
        callback(results[file] ?? null)
    }) as never)
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
        vi.mocked(cp.execFile).mockReset()
        logMock.info.mockClear()
        logMock.warn.mockClear()
        restore = [stubProcess('platform', 'linux'), stubProcess('version', '26.9.0')]
    })

    afterEach(() => {
        restore.forEach((fn) => fn())
    })

    it('unzips the downloaded archive with unzip into the build folder', async () => {
        execFileResults({})

        await unzipWithOsTool(args)

        expect(install).toHaveBeenCalledWith({ ...args, platform: 'linux', unpack: false })
        expect(fsp.mkdir).toHaveBeenCalledWith(outputPath, { recursive: true })
        expect(cp.execFile).toHaveBeenCalledWith('unzip', ['-o', archivePath, '-d', outputPath], expect.any(Function))
        expect(fsp.rm).not.toHaveBeenCalled()
        expect(logMock.info).toHaveBeenCalledWith('Unzipped chromedriver v133.0.6943.141 with unzip')
    })

    it('does nothing when the build folder exists', async () => {
        vi.mocked(fsp.access).mockResolvedValue(undefined)

        await unzipWithOsTool(args)

        expect(install).not.toHaveBeenCalled()
        expect(cp.execFile).not.toHaveBeenCalled()
    })

    it('leaves other archive types to install()', async () => {
        vi.mocked(install).mockResolvedValue('/cache/firefox/stable_157.0-firefox-157.0.tar.xz' as never)

        await unzipWithOsTool(args)

        expect(cp.execFile).not.toHaveBeenCalled()
        expect(fsp.mkdir).not.toHaveBeenCalled()
    })

    it('does nothing before Node 26, where extract-zip works', async () => {
        restore.push(stubProcess('version', '24.15.0'))

        await unzipWithOsTool(args)

        expect(install).not.toHaveBeenCalled()
        expect(cp.execFile).not.toHaveBeenCalled()
    })

    it('leaves the archive to extract-zip with a warning when unzip is not installed', async () => {
        execFileResults({ unzip: errnoError('ENOENT') })

        await unzipWithOsTool(args)

        expect(fsp.rm).toHaveBeenCalledTimes(1)
        expect(fsp.rm).toHaveBeenCalledWith(outputPath, { recursive: true, force: true })
        expect(logMock.warn).toHaveBeenCalledWith(expect.stringContaining('Install `unzip`'))
    })

    it('removes the build folder and the archive when unzip fails', async () => {
        execFileResults({ unzip: Object.assign(new Error('exit 9'), { stderr: 'End-of-central-directory signature not found' }) })

        await expect(unzipWithOsTool(args)).rejects.toThrow(`Failed to unzip ${archivePath}: End-of-central-directory signature not found`)

        expect(fsp.rm).toHaveBeenCalledWith(outputPath, { recursive: true, force: true })
        expect(fsp.rm).toHaveBeenCalledWith(archivePath, { force: true })
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
            expect(cp.execFile).toHaveBeenCalledWith('C:\\Windows\\System32\\tar.exe', ['-xf', archivePath, '-C', outputPath], expect.any(Function))
        })

        it('tries PowerShell when tar.exe fails', async () => {
            execFileResults({ 'C:\\Windows\\System32\\tar.exe': new Error('tar failed') })

            await unzipWithOsTool(args)

            expect(cp.execFile).toHaveBeenCalledTimes(2)
            expect(cp.execFile).toHaveBeenLastCalledWith('powershell.exe', expect.arrayContaining([archivePath, outputPath]), expect.any(Function))
            expect(logMock.info).toHaveBeenCalledWith('Unzipped chromedriver v133.0.6943.141 with powershell.exe')
        })

        it('leaves the archive to extract-zip when no tool is installed', async () => {
            execFileResults({
                'C:\\Windows\\System32\\tar.exe': errnoError('ENOENT'),
                'powershell.exe': errnoError('ENOENT'),
                'pwsh.exe': errnoError('ENOENT')
            })

            await unzipWithOsTool(args)

            expect(cp.execFile).toHaveBeenLastCalledWith('pwsh.exe', expect.arrayContaining([archivePath, outputPath]), expect.any(Function))
            expect(fsp.rm).toHaveBeenCalledWith(outputPath, { recursive: true, force: true })
        })
    })
})
