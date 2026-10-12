import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { spawn, execSync, execFile } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import url from 'node:url'
import { resolve as resolveModule } from 'import-meta-resolve'
import {
    extractPortFromCliArgs,
    determineAppiumCliCommand,
    openBrowser,
    removePortFromArgs,
    startAppiumForCli,
    checkInspectorPluginInstalled,
    ensureInspectorPluginInstalled
} from '../src/cli-utils.js'

vi.mock('node:child_process', () => ({
    spawn: vi.fn(),
    execSync: vi.fn(),
    execFile: vi.fn()
}))

const { mockQuestion } = vi.hoisted(() => ({ mockQuestion: vi.fn() }))

vi.mock('node:readline/promises', () => ({
    default: {
        createInterface: vi.fn(() => ({ question: mockQuestion, close: vi.fn() }))
    }
}))

vi.mock('import-meta-resolve', () => ({
    resolve: vi.fn()
}))

vi.mock('node:fs', () => ({
    default: {
        existsSync: vi.fn(() => false)
    }
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

describe('removePortFromArgs', () => {
    it('should remove --port=5555 format from args', () => {
        const args = ['--port=5555', '--log-timestamp', '--allow-cors']
        removePortFromArgs(args)
        expect(args).toEqual(['--log-timestamp', '--allow-cors'])
    })

    it('should remove --port 5555 format from args (two separate arguments)', () => {
        const args = ['--port', '5555', '--log-timestamp', '--allow-cors']
        removePortFromArgs(args)
        expect(args).toEqual(['--log-timestamp', '--allow-cors'])
    })

    it('should not modify args when no --port argument exists', () => {
        const args = ['--log-timestamp', '--allow-cors']
        const originalArgs = [...args]
        removePortFromArgs(args)
        expect(args).toEqual(originalArgs)
    })

    it('should handle empty args array', () => {
        const args: string[] = []
        removePortFromArgs(args)
        expect(args).toEqual([])
    })

    it('should remove all --port arguments when multiple exist', () => {
        const args = ['--port=8080', '--log-timestamp', '--port=4723', '--allow-cors']
        removePortFromArgs(args)
        expect(args).toEqual(['--log-timestamp', '--allow-cors'])
    })

    it('should remove all --port arguments in mixed formats', () => {
        const args = ['--port=8080', '--log-timestamp', '--port', '4723', '--allow-cors', '--port=9999']
        removePortFromArgs(args)
        expect(args).toEqual(['--log-timestamp', '--allow-cors'])
    })
})

describe('determineAppiumCliCommand', () => {
    const savedPrefix = process.env.npm_config_prefix
    const savedPrefixUpper = process.env.NPM_CONFIG_PREFIX

    beforeEach(() => {
        vi.clearAllMocks()
        delete process.env.npm_config_prefix
        delete process.env.NPM_CONFIG_PREFIX
    })

    afterEach(() => {
        if (process.platform === 'win32') {
            const value = savedPrefix ?? savedPrefixUpper
            if (value === undefined) {
                delete process.env.npm_config_prefix
            } else {
                process.env.npm_config_prefix = value
            }
            return
        }
        if (savedPrefix === undefined) {
            delete process.env.npm_config_prefix
        } else {
            process.env.npm_config_prefix = savedPrefix
        }
        if (savedPrefixUpper === undefined) {
            delete process.env.NPM_CONFIG_PREFIX
        } else {
            process.env.NPM_CONFIG_PREFIX = savedPrefixUpper
        }
    })

    it('should resolve Appium from local node_modules', async () => {
        const mockPath = url.pathToFileURL('/project/node_modules/appium/index.js').toString()
        vi.mocked(resolveModule).mockResolvedValueOnce(mockPath)

        const result = await determineAppiumCliCommand()
        expect(result).toBe(url.fileURLToPath(mockPath))
        expect(resolveModule).toHaveBeenCalled()
    })

    it('should fallback to import.meta.url resolution when local fails', async () => {
        const mockPath = url.pathToFileURL('/global/appium/index.js').toString()
        vi.mocked(resolveModule)
            .mockRejectedValueOnce(new Error('Not found locally'))
            .mockResolvedValueOnce(mockPath)

        const result = await determineAppiumCliCommand()
        expect(result).toBe(url.fileURLToPath(mockPath))
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
        expect(result).toBe(url.fileURLToPath(mockPath))
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

    it('should spawn Node directly, without cmd, on Windows', async () => {
        vi.mocked(os.platform).mockReturnValue('win32')

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

    it('should pass stderr through and reject via exit event', async () => {
        vi.mocked(os.platform).mockReturnValue('darwin')

        const promise = startAppiumForCli('/path/to/appium', ['server'])

        const onStderrHandler = mockStderr.on.mock.calls.find((call: any[]) => call[0] === 'data')?.[1]
        if (onStderrHandler) {
            onStderrHandler(Buffer.from('ERROR: Port already in use'))
        }

        // Stderr is passed through, not rejected immediately
        expect(process.stderr.write).toHaveBeenCalledWith('ERROR: Port already in use')

        // Rejection happens via exit event with accumulated stderr content
        const onExitHandler = mockProcess.once.mock.calls.find((call: any[]) => call[0] === 'exit')?.[1]
        if (onExitHandler) {
            onExitHandler(1)
        }

        await expect(promise).rejects.toThrow('Port already in use')
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

        vi.mocked(execFile).mockImplementation((file, args, options, callback: any) => {
            setImmediate(() => callback(null, { stdout: '', stderr: mockOutput }))
            return {} as any
        })

        await expect(checkInspectorPluginInstalled('/path/to/appium')).resolves.not.toThrow()

        expect(execFile).toHaveBeenCalledWith(
            'node',
            ['/path/to/appium', 'plugin', 'list', '--installed'],
            expect.objectContaining({ encoding: 'utf-8' }),
            expect.any(Function)
        )
    })

    it('should throw error when both stdout and stderr are empty', async () => {
        vi.mocked(execFile).mockImplementation((file, args, options, callback: any) => {
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

        vi.mocked(execFile).mockImplementation((file, args, options, callback: any) => {
            setImmediate(() => callback(null, { stdout: '', stderr: mockOutput }))

            return {} as any
        })

        await expect(checkInspectorPluginInstalled('/path/to/appium')).rejects.toThrow(
            'Appium Inspector plugin is not installed'
        )
    })

    it('should throw error when execFile fails', async () => {
        const mockError = new Error('Command failed')
        vi.mocked(execFile).mockImplementation((file, args, options, callback: any) => {
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

        vi.mocked(execFile).mockImplementation((file, args, options, callback: any) => {
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

        vi.mocked(execFile).mockImplementation((file, args, options, callback: any) => {
            setImmediate(() => callback(null, { stdout: '', stderr: mockOutput }))

            return {} as any
        })

        await expect(checkInspectorPluginInstalled('/path/to/appium')).resolves.not.toThrow()
    })
})

describe('ensureInspectorPluginInstalled', () => {
    const missing = '✔ Listing installed plugins\n- execute-driver [installed (npm)]'
    const installed = '✔ Listing installed plugins\n- inspector@2025.11.1 [installed (npm)]'
    let originalIsTTY: boolean | undefined

    const mockPluginList = (...outputs: string[]) => {
        outputs.forEach((stderr) => {
            vi.mocked(execFile).mockImplementationOnce(((file: any, args: any, options: any, callback: any) => {
                setImmediate(() => callback(null, { stdout: '', stderr }))
                return {} as any
            }) as any)
        })
    }

    const mockInstall = (exitCode: number) => {
        vi.mocked(spawn).mockImplementationOnce((() => {
            const installProcess: any = { once: vi.fn((event: string, cb: (arg: any) => void) => {
                if (event === 'exit') {
                    setImmediate(() => cb(exitCode))
                }
                return installProcess
            }) }
            return installProcess
        }) as any)
    }

    beforeEach(() => {
        vi.clearAllMocks()
        originalIsTTY = process.stdin.isTTY
        process.stdin.isTTY = true
        vi.mocked(fs.existsSync).mockReturnValue(false)
        vi.mocked(os.platform).mockReturnValue('darwin')
        vi.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(() => {
        process.stdin.isTTY = originalIsTTY as boolean
    })

    it('should not ask anything when the plugin is installed', async () => {
        mockPluginList(installed)

        await ensureInspectorPluginInstalled('/path/to/appium')

        expect(mockQuestion).not.toHaveBeenCalled()
        expect(spawn).not.toHaveBeenCalled()
    })

    it('should add the plugin as dev dependency by default and check again', async () => {
        mockPluginList(missing, installed)
        mockQuestion.mockResolvedValue('')
        mockInstall(0)

        await ensureInspectorPluginInstalled('/path/to/appium')

        expect(spawn).toHaveBeenCalledWith(
            'npm',
            ['install', '--save-dev', 'appium-inspector-plugin'],
            { stdio: 'inherit', shell: false }
        )
        expect(execFile).toHaveBeenCalledTimes(2)
    })

    it.each([
        ['pnpm-lock.yaml', 'pnpm', ['add', '-D', 'appium-inspector-plugin']],
        ['yarn.lock', 'yarn', ['add', '-D', 'appium-inspector-plugin']],
        ['bun.lock', 'bun', ['add', '-d', 'appium-inspector-plugin']]
    ])('should use the package manager of the project for %s', async (lockFile, command, args) => {
        vi.mocked(fs.existsSync).mockImplementation((file) => file === lockFile)
        mockPluginList(missing, installed)
        mockQuestion.mockResolvedValue('1')
        mockInstall(0)

        await ensureInspectorPluginInstalled('/path/to/appium')

        expect(spawn).toHaveBeenCalledWith(command, args, { stdio: 'inherit', shell: false })
    })

    it('should use a shell for the package manager on Windows', async () => {
        vi.mocked(os.platform).mockReturnValue('win32')
        mockPluginList(missing, installed)
        mockQuestion.mockResolvedValue('1')
        mockInstall(0)

        await ensureInspectorPluginInstalled('/path/to/appium')

        expect(spawn).toHaveBeenCalledWith('npm', expect.any(Array), { stdio: 'inherit', shell: true })
    })

    it('should install the plugin into Appium only when chosen', async () => {
        mockPluginList(missing, installed)
        mockQuestion.mockResolvedValue('2')
        mockInstall(0)

        await ensureInspectorPluginInstalled('/path/to/appium')

        expect(spawn).toHaveBeenCalledWith(
            'node',
            ['/path/to/appium', 'plugin', 'install', '--source=npm', 'appium-inspector-plugin'],
            { stdio: 'inherit', shell: false }
        )
    })

    it('should throw the original error when the user declines', async () => {
        mockPluginList(missing)
        mockQuestion.mockResolvedValue('3')

        await expect(ensureInspectorPluginInstalled('/path/to/appium')).rejects.toThrow(
            'Appium Inspector plugin is not installed'
        )
        expect(spawn).not.toHaveBeenCalled()
    })

    it('should throw the original error without asking when there is no TTY', async () => {
        process.stdin.isTTY = false
        mockPluginList(missing)

        await expect(ensureInspectorPluginInstalled('/path/to/appium')).rejects.toThrow(
            'Appium Inspector plugin is not installed'
        )
        expect(mockQuestion).not.toHaveBeenCalled()
    })

    it('should throw when the installation fails', async () => {
        mockPluginList(missing)
        mockQuestion.mockResolvedValue('1')
        mockInstall(1)

        await expect(ensureInspectorPluginInstalled('/path/to/appium')).rejects.toThrow(
            'Installing the Appium Inspector plugin failed (exit code: 1)'
        )
    })

    it('should not offer an installation for other check failures', async () => {
        vi.mocked(execFile).mockImplementationOnce(((file: any, args: any, options: any, callback: any) => {
            setImmediate(() => callback(new Error('Command failed')))
            return {} as any
        }) as any)

        await expect(ensureInspectorPluginInstalled('/path/to/appium')).rejects.toThrow(
            'Failed to check Appium Inspector plugin installation'
        )
        expect(mockQuestion).not.toHaveBeenCalled()
    })
})
