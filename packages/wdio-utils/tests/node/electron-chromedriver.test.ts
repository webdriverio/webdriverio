import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { getElectronPlatform, setupElectronChromedriver } from '../../src/node/utils.js'

vi.mock('node:os', () => ({
    default: {
        platform: vi.fn().mockReturnValue('linux'),
        arch: vi.fn().mockReturnValue('arm64'),
        tmpdir: vi.fn().mockReturnValue('/tmp')
    }
}))

vi.mock('node:fs/promises', () => ({
    default: {
        access: vi.fn().mockRejectedValue(new Error('ENOENT')),
        mkdir: vi.fn().mockResolvedValue(undefined),
        unlink: vi.fn().mockResolvedValue(undefined),
        chmod: vi.fn().mockResolvedValue(undefined)
    }
}))

vi.mock('node:fs', () => ({
    default: {
        createWriteStream: vi.fn().mockReturnValue({
            on: vi.fn((event, cb) => {
                if (event === 'finish') { setTimeout(cb, 10) }
                return { on: vi.fn() }
            }),
            close: vi.fn()
        }),
        unlink: vi.fn()
    }
}))

vi.mock('node:https', () => ({
    default: {
        get: vi.fn((url, cb) => {
            const mockResponse = {
                statusCode: 200,
                headers: { 'content-length': '1000' },
                on: vi.fn((event, handler) => {
                    if (event === 'data') {
                        setTimeout(() => handler(Buffer.from('test')), 5)
                    }
                    return mockResponse
                }),
                pipe: vi.fn()
            }
            setTimeout(() => cb(mockResponse), 5)
            return { on: vi.fn() }
        })
    }
}))

vi.mock('extract-zip', () => ({
    default: vi.fn().mockResolvedValue(undefined)
}))

describe('getElectronPlatform', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should return linux-arm64 for linux arm64', () => {
        vi.mocked(os.platform).mockReturnValue('linux')
        vi.mocked(os.arch).mockReturnValue('arm64')
        expect(getElectronPlatform()).toBe('linux-arm64')
    })

    it('should return linux-x64 for linux x64', () => {
        vi.mocked(os.platform).mockReturnValue('linux')
        vi.mocked(os.arch).mockReturnValue('x64')
        expect(getElectronPlatform()).toBe('linux-x64')
    })

    it('should return linux-armv7l for linux arm', () => {
        vi.mocked(os.platform).mockReturnValue('linux')
        vi.mocked(os.arch).mockReturnValue('arm')
        expect(getElectronPlatform()).toBe('linux-armv7l')
    })

    it('should return darwin-arm64 for macOS Apple Silicon', () => {
        vi.mocked(os.platform).mockReturnValue('darwin')
        vi.mocked(os.arch).mockReturnValue('arm64')
        expect(getElectronPlatform()).toBe('darwin-arm64')
    })

    it('should return darwin-x64 for macOS Intel', () => {
        vi.mocked(os.platform).mockReturnValue('darwin')
        vi.mocked(os.arch).mockReturnValue('x64')
        expect(getElectronPlatform()).toBe('darwin-x64')
    })

    it('should return win32-x64 for Windows 64-bit', () => {
        vi.mocked(os.platform).mockReturnValue('win32')
        vi.mocked(os.arch).mockReturnValue('x64')
        expect(getElectronPlatform()).toBe('win32-x64')
    })

    it('should return win32-ia32 for Windows 32-bit', () => {
        vi.mocked(os.platform).mockReturnValue('win32')
        vi.mocked(os.arch).mockReturnValue('ia32')
        expect(getElectronPlatform()).toBe('win32-ia32')
    })

    it('should return win32-arm64 for Windows ARM', () => {
        vi.mocked(os.platform).mockReturnValue('win32')
        vi.mocked(os.arch).mockReturnValue('arm64')
        expect(getElectronPlatform()).toBe('win32-arm64')
    })

    it('should throw for unsupported platform', () => {
        vi.mocked(os.platform).mockReturnValue('freebsd' as NodeJS.Platform)
        vi.mocked(os.arch).mockReturnValue('x64')
        expect(() => getElectronPlatform()).toThrow('Unsupported platform for Electron ChromeDriver: freebsd')
    })

    it('should throw for unsupported architecture', () => {
        vi.mocked(os.platform).mockReturnValue('linux')
        vi.mocked(os.arch).mockReturnValue('ppc64' as string)
        expect(() => getElectronPlatform()).toThrow('Unsupported architecture for Electron ChromeDriver: linux-ppc64')
    })
})

describe('setupElectronChromedriver', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(os.platform).mockReturnValue('linux')
        vi.mocked(os.arch).mockReturnValue('arm64')
    })

    it('should use cached driver if available', async () => {
        vi.mocked(fs.access).mockResolvedValueOnce(undefined)

        const result = await setupElectronChromedriver('/cache', '37.6.0')

        expect(result.executablePath).toContain('37.6.0')
        expect(result.executablePath).toContain('linux-arm64')
        expect(result.executablePath).toContain('chromedriver')
        expect(fs.mkdir).not.toHaveBeenCalled()
    })

    it('should handle version with v prefix', async () => {
        vi.mocked(fs.access).mockResolvedValueOnce(undefined)

        const result = await setupElectronChromedriver('/cache', 'v37.6.0')

        // Version should be normalized (v prefix removed)
        expect(result.executablePath).toContain('37.6.0')
        expect(result.executablePath).not.toContain('vv') // Should not have double v
    })

    it('should construct correct cache directory path', async () => {
        vi.mocked(fs.access).mockResolvedValueOnce(undefined)

        const result = await setupElectronChromedriver('/my/cache', '37.6.0')

        const expectedPath = path.join('/my/cache', 'electron-chromedriver', '37.6.0', 'linux-arm64', 'chromedriver')
        expect(result.executablePath).toBe(expectedPath)
    })

    it('should use .exe extension on Windows', async () => {
        vi.mocked(os.platform).mockReturnValue('win32')
        vi.mocked(os.arch).mockReturnValue('x64')
        vi.mocked(fs.access).mockResolvedValueOnce(undefined)

        const result = await setupElectronChromedriver('/cache', '37.6.0')

        expect(result.executablePath).toContain('chromedriver.exe')
    })

    it('should use correct executable name on non-Windows', async () => {
        vi.mocked(os.platform).mockReturnValue('linux')
        vi.mocked(os.arch).mockReturnValue('arm64')
        vi.mocked(fs.access).mockResolvedValueOnce(undefined)

        const result = await setupElectronChromedriver('/cache', '37.6.0')

        expect(result.executablePath).toContain('chromedriver')
        expect(result.executablePath).not.toContain('.exe')
    })
})
