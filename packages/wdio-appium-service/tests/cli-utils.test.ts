import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { spawn, execSync, exec } from 'node:child_process'
import os from 'node:os'
import url from 'node:url'
import { resolve as resolveModule } from 'import-meta-resolve'
import { extractPortFromCliArgs, determineAppiumCliCommand, openBrowser, startAppiumForCli, checkInspectorPluginInstalled } from '../src/cli-utils.js'

vi.mock('node:child_process', () => ({
    spawn: vi.fn(),
    execSync: vi.fn(),
    exec: vi.fn()
}))

vi.mock('import-meta-resolve', () => ({
    resolve: vi.fn()
}))

vi.mock('node:os', () => ({
    default: {
        platform: vi.fn()
    }
}))

describe('extractPortFromCliArgs', () => {
    it('should extract valid port from both --port= and --port formats', () => {
        expect(extractPortFromCliArgs(['--port=4725'])).toBe(4725)
        expect(extractPortFromCliArgs(['--port', '4725'])).toBe(4725)
    })

    it('should return default port 4723 when no port argument is provided', () => {
        expect(extractPortFromCliArgs(['--log-timestamp'])).toBe(4723)
        expect(extractPortFromCliArgs([])).toBe(4723)
    })

    it('should throw error when --port is provided without value', () => {
        expect(() => extractPortFromCliArgs(['--port', '--log-timestamp'])).toThrow('Missing port value after --port flag')
    })

    it('should accept valid port range (1-65535)', () => {
        expect(extractPortFromCliArgs(['--port=1'])).toBe(1)
        expect(extractPortFromCliArgs(['--port=65535'])).toBe(65535)
    })

    it('should return default port for invalid port values', () => {
        const invalidPorts = ['0', '-1', '65536', '4723.5', 'abc', '', 'NaN']
        invalidPorts.forEach(invalidPort => {
            expect(extractPortFromCliArgs([`--port=${invalidPort}`])).toBe(4723)
        })
    })

    it('should use first port argument if multiple port arguments exist', () => {
        expect(extractPortFromCliArgs(['--port=8080', '--port=4723'])).toBe(8080)
    })
})

describe('determineAppiumCliCommand', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should resolve Appium from local node_modules', async () => {
        const mockPath = url.pathToFileURL('/project/node_modules/appium/index.js').toString()
        vi.mocked(resolveModule).mockResolvedValueOnce(mockPath)

        const result = await determineAppiumCliCommand()
        expect(result).toBe('/project/node_modules/appium/index.js')
        expect(resolveModule).toHaveBeenCalled()
    })

    it('should fallback to import.meta.url resolution when local fails', async () => {
        const mockPath = url.pathToFileURL('/global/appium/index.js').toString()
        vi.mocked(resolveModule)
            .mockRejectedValueOnce(new Error('Not found locally'))
            .mockResolvedValueOnce(mockPath)

        const result = await determineAppiumCliCommand()
        expect(result).toBe('/global/appium/index.js')
        expect(resolveModule).toHaveBeenCalledTimes(2)
    })

    it('should fallback to global npm prefix when other methods fail', async () => {
        const mockPath = url.pathToFileURL('/usr/lib/node_modules/appium/index.js').toString()
        vi.mocked(resolveModule)
            .mockRejectedValueOnce(new Error('Not found locally'))
            .mockRejectedValueOnce(new Error('Not found in package'))
        vi.mocked(execSync).mockReturnValueOnce('/usr')
        vi.mocked(resolveModule).mockResolvedValueOnce(mockPath)

        const result = await determineAppiumCliCommand()
        expect(result).toBe('/usr/lib/node_modules/appium/index.js')
        expect(execSync).toHaveBeenCalledWith('npm config get prefix', { encoding: 'utf-8' })
    })

    it('should throw error with helpful message when Appium is not found', async () => {
        vi.mocked(resolveModule)
            .mockRejectedValueOnce(new Error('Not found locally'))
            .mockRejectedValueOnce(new Error('Not found in package'))
        vi.mocked(execSync).mockReturnValueOnce('/usr')
        vi.mocked(resolveModule).mockRejectedValueOnce(new Error('Not found globally'))

        await expect(determineAppiumCliCommand()).rejects.toThrow(/Appium is not installed|npm install -g appium/)
    })

    it('should throw error when execSync fails and all resolution methods fail', async () => {
        vi.mocked(resolveModule)
            .mockRejectedValueOnce(new Error('Not found locally'))
            .mockRejectedValueOnce(new Error('Not found in package'))
        vi.mocked(execSync).mockImplementation(() => {
            throw new Error('npm config failed')
        })

        await expect(determineAppiumCliCommand()).rejects.toThrow(/Appium is not installed|npm install -g appium/)
    })
})

describe('openBrowser', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    const inspectorUrl = 'https://inspector.appiumpro.com/'
    const openingBrowserMessage = '🌐 Opening Appium Inspector in your default browser...'
    const openedBrowserMessage = '✅ Opened Appium Inspector in your default browser.'
    const browserOpeningFailedMessage = `⚠️ Automatically starting the default browser didn't work, please open your favorite browser and paste the url '${inspectorUrl}' in there`

    it('should open browser on macOS', async () => {
        vi.mocked(os.platform).mockReturnValue('darwin')
        vi.mocked(execSync).mockImplementation(() => Buffer.from(''))

        await openBrowser(inspectorUrl)

        expect(execSync).toHaveBeenCalledWith(`open "${inspectorUrl}"`, { stdio: 'ignore' })
        expect(console.log).toHaveBeenCalledWith(openingBrowserMessage)
        expect(console.log).toHaveBeenCalledWith(openedBrowserMessage)
    })

    it('should open browser on Windows', async () => {
        vi.mocked(os.platform).mockReturnValue('win32')
        vi.mocked(execSync).mockImplementation(() => Buffer.from(''))

        await openBrowser(inspectorUrl)

        expect(execSync).toHaveBeenCalledWith(`start "" "${inspectorUrl}"`, { stdio: 'ignore' })
        expect(console.log).toHaveBeenCalledWith(openedBrowserMessage)
    })

    it('should open browser on Linux', async () => {
        vi.mocked(os.platform).mockReturnValue('linux')
        vi.mocked(execSync).mockImplementation(() => Buffer.from(''))

        await openBrowser(inspectorUrl)

        expect(execSync).toHaveBeenCalledWith(`xdg-open "${inspectorUrl}"`, { stdio: 'ignore' })
        expect(console.log).toHaveBeenCalledWith(openedBrowserMessage)
    })

    it('should handle error when browser opening fails', async () => {
        vi.mocked(os.platform).mockReturnValue('darwin')
        vi.mocked(execSync).mockImplementation(() => {
            throw new Error('Command failed')
        })

        await openBrowser(inspectorUrl)

        expect(console.log).toHaveBeenCalledWith(openingBrowserMessage)
        expect(console.warn).toHaveBeenCalledWith(browserOpeningFailedMessage)
    })
})

describe('startAppiumForCli', () => {
    let mockProcess: any
    let mockStdout: any
    let mockStderr: any

    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()

        mockStdout = {
            on: vi.fn(),
            off: vi.fn(),
            write: vi.fn()
        }
        mockStderr = {
            on: vi.fn(),
            off: vi.fn(),
            write: vi.fn()
        }
        mockProcess = {
            pid: 12345,
            stdout: mockStdout,
            stderr: mockStderr,
            once: vi.fn(),
            kill: vi.fn()
        }

        vi.mocked(spawn).mockReturnValue(mockProcess as any)
        vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
        vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.useRealTimers()
    })

    it('should spawn Appium process with correct arguments on non-Windows', async () => {
        vi.mocked(os.platform).mockReturnValue('darwin')

        const promise = startAppiumForCli('/path/to/appium', ['server', '--port=4723'])

        expect(spawn).toHaveBeenCalledWith('node', ['/path/to/appium', 'server', '--port=4723'], {
            stdio: ['ignore', 'pipe', 'pipe']
        })

        const onStdoutHandler = mockStdout.on.mock.calls.find((call: any[]) => call[0] === 'data')?.[1]
        if (onStdoutHandler) {
            onStdoutHandler(Buffer.from('Appium REST http interface listener started'))
        }

        await promise
    })

    it('should spawn Appium process with Windows command format on Windows', async () => {
        vi.mocked(os.platform).mockReturnValue('win32')

        const promise = startAppiumForCli('/path/to/appium', ['server', '--port=4723'])

        expect(spawn).toHaveBeenCalledWith('cmd', ['/c', 'node', '/path/to/appium', 'server', '--port=4723'], {
            stdio: ['ignore', 'pipe', 'pipe']
        })

        const onStdoutHandler = mockStdout.on.mock.calls.find((call: any[]) => call[0] === 'data')?.[1]
        if (onStdoutHandler) {
            onStdoutHandler(Buffer.from('Appium REST http interface listener started'))
        }

        await promise
    })

    it('should resolve when Appium starts successfully', async () => {
        vi.mocked(os.platform).mockReturnValue('darwin')

        const promise = startAppiumForCli('/path/to/appium', ['server'])

        const onStdoutHandler = mockStdout.on.mock.calls.find((call: any[]) => call[0] === 'data')?.[1]
        if (onStdoutHandler) {
            onStdoutHandler(Buffer.from('Appium REST http interface listener started'))
        }

        await promise

        expect(mockStdout.on).toHaveBeenCalledWith('data', expect.any(Function))
        expect(mockStderr.on).toHaveBeenCalledWith('data', expect.any(Function))
    })

    it('should reject on timeout if Appium does not start', async () => {
        vi.mocked(os.platform).mockReturnValue('darwin')

        const promise = startAppiumForCli('/path/to/appium', ['server'], 1000)

        vi.advanceTimersByTime(1001)

        await expect(promise).rejects.toThrow('Timeout: Appium did not start within expected time')
    })

    it('should reject on stderr error (non-warning)', async () => {
        vi.mocked(os.platform).mockReturnValue('darwin')

        const promise = startAppiumForCli('/path/to/appium', ['server'])

        const onStderrHandler = mockStderr.on.mock.calls.find((call: any[]) => call[0] === 'data')?.[1]
        if (onStderrHandler) {
            onStderrHandler(Buffer.from('ERROR: Port already in use'))
        }

        await expect(promise).rejects.toThrow('Port already in use')
        // Note: process.stderr.write is not called for first non-warning error because function returns early
    })

    it('should not reject on WARN messages', async () => {
        vi.mocked(os.platform).mockReturnValue('darwin')

        const promise = startAppiumForCli('/path/to/appium', ['server'])

        // Simulate stderr warning
        const onStderrHandler = mockStderr.on.mock.calls.find((call: any[]) => call[0] === 'data')?.[1]
        if (onStderrHandler) {
            onStderrHandler(Buffer.from('WARN: Some warning message'))
        }

        vi.advanceTimersByTime(100)

        // Should still be pending (not rejected) - verify it doesn't reject
        expect(process.stderr.write).toHaveBeenCalled()

        // Clean up by simulating successful start
        const onStdoutHandler = mockStdout.on.mock.calls.find((call: any[]) => call[0] === 'data')?.[1]
        if (onStdoutHandler) {
            onStdoutHandler(Buffer.from('Appium REST http interface listener started'))
        }

        await promise
    })

    it('should ignore debugger messages', async () => {
        vi.mocked(os.platform).mockReturnValue('darwin')

        const promise = startAppiumForCli('/path/to/appium', ['server'])

        const onStderrHandler = mockStderr.on.mock.calls.find((call: any[]) => call[0] === 'data')?.[1]
        if (onStderrHandler) {
            onStderrHandler(Buffer.from('Debugger attached'))
        }

        expect(process.stderr.write).not.toHaveBeenCalled()

        // Clean up by simulating successful start
        const onStdoutHandler = mockStdout.on.mock.calls.find((call: any[]) => call[0] === 'data')?.[1]
        if (onStdoutHandler) {
            onStdoutHandler(Buffer.from('Appium REST http interface listener started'))
        }

        await promise
    })

    it('should reject on process exit with non-zero code', async () => {
        vi.mocked(os.platform).mockReturnValue('darwin')
        vi.spyOn(console, 'error').mockImplementation(() => {})

        const promise = startAppiumForCli('/path/to/appium', ['server'])

        const onExitHandler = mockProcess.once.mock.calls.find((call: any[]) => call[0] === 'exit')?.[1]
        if (onExitHandler) {
            onExitHandler(2)
        }

        await expect(promise).rejects.toThrow('Appium exited before timeout')
        expect(console.error).toHaveBeenCalled()
    })

    it('should handle exit code 2 with specific message', async () => {
        vi.mocked(os.platform).mockReturnValue('darwin')
        vi.spyOn(console, 'error').mockImplementation(() => {})

        const promise = startAppiumForCli('/path/to/appium', ['server'])

        const onExitHandler = mockProcess.once.mock.calls.find((call: any[]) => call[0] === 'exit')?.[1]
        if (onExitHandler) {
            onExitHandler(2)
        }

        await expect(promise).rejects.toThrow('Check that you don\'t already have a running Appium service')
    })

    it('should write stdout data to process.stdout', async () => {
        vi.mocked(os.platform).mockReturnValue('darwin')

        const promise = startAppiumForCli('/path/to/appium', ['server'])

        const onStdoutHandler = mockStdout.on.mock.calls.find((call: any[]) => call[0] === 'data')?.[1]
        if (onStdoutHandler) {
            onStdoutHandler(Buffer.from('Some Appium output'))
            // Also send the ready message to resolve the promise
            onStdoutHandler(Buffer.from('Appium REST http interface listener started'))
        }

        expect(process.stdout.write).toHaveBeenCalledWith('Some Appium output')
        await promise
    })
})

describe('checkInspectorPluginInstalled', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should not throw when inspector plugin is installed', async () => {
        const mockOutput = `✔ Listing installed plugins
- inspector@2025.11.1 [installed (npm)]`

        vi.mocked(exec).mockImplementation((command, options, callback: any) => {
            setImmediate(() => callback(null, { stdout: '', stderr: mockOutput }))
            return {} as any
        })

        await expect(checkInspectorPluginInstalled('/path/to/appium')).resolves.not.toThrow()

        expect(exec).toHaveBeenCalledWith(
            '/path/to/appium plugin list --installed',
            expect.objectContaining({ encoding: 'utf-8' }),
            expect.any(Function)
        )
    })

    it('should throw error when both stdout and stderr are empty', async () => {
        vi.mocked(exec).mockImplementation((command, options, callback: any) => {
            setImmediate(() => callback(null, { stdout: '', stderr: '' }))
            return {} as any
        })

        await expect(checkInspectorPluginInstalled('/path/to/appium')).rejects.toThrow(
            'Appium Inspector plugin is not installed'
        )
    })

    it('should throw error when inspector plugin is not installed', async () => {
        const mockOutput = `✔ Listing installed plugins
- execute-driver [installed (npm)]`

        vi.mocked(exec).mockImplementation((command, options, callback: any) => {
            setImmediate(() => callback(null, { stdout: '', stderr: mockOutput }))

            return {} as any
        })

        await expect(checkInspectorPluginInstalled('/path/to/appium')).rejects.toThrow(
            'Appium Inspector plugin is not installed'
        )
    })

    it('should throw error when exec fails', async () => {
        const mockError = new Error('Command failed')
        vi.mocked(exec).mockImplementation((command, options, callback: any) => {
            setImmediate(() => callback(mockError, { stdout: '', stderr: '' }))

            return {} as any
        })

        await expect(checkInspectorPluginInstalled('/path/to/appium')).rejects.toThrow(
            'Failed to check Appium Inspector plugin installation'
        )
    })

    it('should include documentation URL in error messages', async () => {
        const mockOutput = `✔ Listing installed plugins
- execute-driver [installed (npm)]`

        vi.mocked(exec).mockImplementation((command, options, callback: any) => {
            setImmediate(() => callback(null, { stdout: '', stderr: mockOutput }))

            return {} as any
        })

        await expect(checkInspectorPluginInstalled('/path/to/appium')).rejects.toThrow(
            'https://appium.github.io/appium-inspector/latest/quickstart/installation/#appium-plugin'
        )
    })

    it('should handle different installed formats', async () => {
        const mockOutput = `✔ Listing installed plugins
- inspector@2025.7.1 [installed (npm)]`

        vi.mocked(exec).mockImplementation((command, options, callback: any) => {
            setImmediate(() => callback(null, { stdout: '', stderr: mockOutput }))

            return {} as any
        })

        await expect(checkInspectorPluginInstalled('/path/to/appium')).resolves.not.toThrow()
    })
})
