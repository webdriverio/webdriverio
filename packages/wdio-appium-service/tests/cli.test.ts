import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { run } from '../src/cli.js'
import * as cliUtils from '../src/cli-utils.js'

vi.mock('../src/cli-utils.js')
vi.mock('tree-kill', () => ({
    default: vi.fn()
}))

const { mockPromisifiedTreeKill } = vi.hoisted(() => ({
    mockPromisifiedTreeKill: vi.fn()
}))

vi.mock('node:util', async () => {
    const actual = await vi.importActual('node:util')
    return {
        ...actual,
        promisify: vi.fn(() => mockPromisifiedTreeKill)
    }
})

describe('cli run', () => {
    let mockProcess: any
    let originalArgv: string[]
    let originalExit: typeof process.exit
    let originalOn: typeof process.on
    let originalStdinResume: typeof process.stdin.resume

    const getSignalHandler = (signal: 'SIGINT' | 'SIGTERM') => {
        return vi.mocked(process.on).mock.calls.find(
            (call: any[]) => call[0] === signal
        )?.[1]
    }

    const testCleanup = async (signal: 'SIGINT' | 'SIGTERM', assertions: (handler: any) => void | Promise<void>) => {
        await run()
        const handler = getSignalHandler(signal)
        expect(handler).toBeDefined()
        await assertions(handler!)
    }

    const testErrorHandling = async (
        mockFn: any,
        error: Error,
        notCalledFns: any[] = []
    ) => {
        mockFn.mockRejectedValue(error)
        await expect(run()).rejects.toThrow(error.message)
        notCalledFns.forEach(fn => expect(fn).not.toHaveBeenCalled())
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()

        originalArgv = process.argv
        originalExit = process.exit
        originalOn = process.on
        originalStdinResume = process.stdin.resume

        process.argv = ['node', 'start-appium-inspector.js']
        process.exit = vi.fn() as any
        process.on = vi.fn() as any
        process.stdin.resume = vi.fn() as any

        vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})

        mockProcess = {
            pid: 12345,
            stdout: { on: vi.fn(), off: vi.fn(), write: vi.fn() },
            stderr: { on: vi.fn(), off: vi.fn(), write: vi.fn() },
            once: vi.fn(),
            kill: vi.fn()
        }

        vi.mocked(cliUtils.extractPortFromCliArgs).mockReturnValue(4723)
        vi.mocked(cliUtils.determineAppiumCliCommand).mockResolvedValue('/path/to/appium')
        vi.mocked(cliUtils.checkInspectorPluginInstalled).mockResolvedValue(undefined)
        vi.mocked(cliUtils.openBrowser).mockResolvedValue()
        vi.mocked(cliUtils.startAppiumForCli).mockResolvedValue(mockProcess as any)

        mockPromisifiedTreeKill.mockResolvedValue(undefined)
        mockPromisifiedTreeKill.mockClear()
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.useRealTimers()
        process.argv = originalArgv
        process.exit = originalExit
        process.on = originalOn
        process.stdin.resume = originalStdinResume
    })

    it('should successfully start the Appium server and open the inspector', async () => {
        const port = 4723

        process.argv = ['node', 'appium-service.js', `--port=${port}`, '--custom-arg', 'value']

        await run()

        expect(cliUtils.extractPortFromCliArgs).toHaveBeenCalled()
        expect(cliUtils.determineAppiumCliCommand).toHaveBeenCalled()
        expect(cliUtils.checkInspectorPluginInstalled).toHaveBeenCalledWith('/path/to/appium')
        expect(cliUtils.startAppiumForCli).toHaveBeenCalledWith(
            '/path/to/appium',
            expect.arrayContaining([
                'server',
                `--port=${port}`,
                '--custom-arg',
                'value',
                '--log-timestamp',
                '--use-plugins=inspector',
                '--allow-cors'
            ])
        )
        expect(cliUtils.openBrowser).toHaveBeenCalledWith(`http://localhost:${port}/inspector`)

        expect(console.log).toHaveBeenCalledWith('⏳ Checking inspector plugin...')
        expect(console.log).toHaveBeenCalledWith('🚀 Starting Appium server...')
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('📡 Command:'))
        expect(console.log).toHaveBeenCalledWith('⏳ Waiting for Appium server to be ready...')
        expect(console.log).toHaveBeenCalledWith('ℹ️  Press Ctrl+C to stop Appium server and exit\n\n')

        const startAppiumCallOrder = vi.mocked(cliUtils.startAppiumForCli).mock.invocationCallOrder[0]
        const openBrowserCallOrder = vi.mocked(cliUtils.openBrowser).mock.invocationCallOrder[0]

        expect(openBrowserCallOrder).toBeGreaterThan(startAppiumCallOrder)
        expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function))
        expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function))
        expect(process.stdin.resume).toHaveBeenCalled()
    })

    it('should not duplicate required flags if already present', async () => {
        process.argv = ['node', 'appium-service.js', '--port=4723', '--log-timestamp', '--use-plugins=inspector', '--allow-cors']

        await run()

        const args = vi.mocked(cliUtils.startAppiumForCli).mock.calls[0][1]

        expect(args.filter((arg: string) => arg === '--log-timestamp').length).toBe(1)
        expect(args.filter((arg: string) => arg === '--use-plugins=inspector').length).toBe(1)
        expect(args.filter((arg: string) => arg === '--allow-cors').length).toBe(1)
    })

    it('should cleanup Appium process on SIGINT', async () => {
        await testCleanup('SIGINT', async (handler) => {
            await handler()

            expect(console.log).toHaveBeenCalledWith('\n🛑 Stopping Appium server...')
            expect(mockPromisifiedTreeKill).toHaveBeenCalledWith(12345, 'SIGTERM')
            expect(console.log).toHaveBeenCalledWith('✅ Appium server stopped successfully')
            expect(process.exit).toHaveBeenCalledWith(0)
        })
    })

    it('should cleanup Appium process on SIGTERM', async () => {
        await testCleanup('SIGTERM', async (handler) => {
            await handler()

            expect(mockPromisifiedTreeKill).toHaveBeenCalledWith(12345, 'SIGTERM')
            expect(process.exit).toHaveBeenCalledWith(0)
        })
    })

    it('should not cleanup multiple times if already cleaning up', async () => {
        await run()

        const sigintHandler = getSignalHandler('SIGINT')

        await sigintHandler!()

        const firstExitCallCount = vi.mocked(process.exit).mock.calls.length

        mockPromisifiedTreeKill.mockClear()

        await sigintHandler!()

        expect(mockPromisifiedTreeKill).not.toHaveBeenCalled()
        expect(vi.mocked(process.exit).mock.calls.length).toBe(firstExitCallCount)
    })

    it('should handle cleanup errors gracefully', async () => {
        mockPromisifiedTreeKill.mockRejectedValue(new Error('Kill failed'))

        await testCleanup('SIGINT', async (handler) => {
            await handler()

            expect(console.error).toHaveBeenCalledWith('Error stopping Appium:', expect.any(Error))
            expect(process.exit).toHaveBeenCalledWith(0)
        })
    })

    it('should handle cleanup when process has no pid', async () => {
        mockProcess.pid = undefined

        await testCleanup('SIGINT', async (handler) => {
            await handler()
            expect(mockPromisifiedTreeKill).not.toHaveBeenCalled()
            expect(process.exit).toHaveBeenCalledWith(0)
        })
    })

    it('should handle error when determineAppiumCliCommand throws', async () => {
        await testErrorHandling(
            vi.mocked(cliUtils.determineAppiumCliCommand),
            new Error('Appium not found'),
            [cliUtils.startAppiumForCli, cliUtils.openBrowser]
        )
    })

    it('should handle error when startAppiumForCli throws', async () => {
        await testErrorHandling(
            vi.mocked(cliUtils.startAppiumForCli),
            new Error('Failed to start Appium'),
            [cliUtils.openBrowser]
        )
    })

    it('should handle error when openBrowser throws', async () => {
        await testErrorHandling(
            vi.mocked(cliUtils.openBrowser),
            new Error('Failed to open browser')
        )
    })

    it('should call checkInspectorPluginInstalled with Appium command', async () => {
        await run()

        expect(cliUtils.checkInspectorPluginInstalled).toHaveBeenCalledWith('/path/to/appium')
        expect(console.log).toHaveBeenCalledWith('⏳ Checking inspector plugin...')

        const determineCallOrder = vi.mocked(cliUtils.determineAppiumCliCommand).mock.invocationCallOrder[0]
        const checkPluginCallOrder = vi.mocked(cliUtils.checkInspectorPluginInstalled).mock.invocationCallOrder[0]

        expect(checkPluginCallOrder).toBeGreaterThan(determineCallOrder)

        const startAppiumCallOrder = vi.mocked(cliUtils.startAppiumForCli).mock.invocationCallOrder[0]

        expect(startAppiumCallOrder).toBeGreaterThan(checkPluginCallOrder)
    })

    it('should handle error when checkInspectorPluginInstalled throws', async () => {
        const error = new Error('Appium Inspector plugin is not installed')
        vi.mocked(cliUtils.checkInspectorPluginInstalled).mockImplementation(() => {
            throw error
        })
        await testErrorHandling(
            vi.mocked(cliUtils.checkInspectorPluginInstalled),
            error,
            [cliUtils.startAppiumForCli, cliUtils.openBrowser]
        )
    })
})
