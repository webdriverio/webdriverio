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

    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()

        originalArgv = process.argv
        originalExit = process.exit
        originalOn = process.on
        originalStdinResume = process.stdin.resume

        process.argv = ['node', 'appium-service.js']
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
        vi.mocked(cliUtils.openBrowser).mockResolvedValue()
        vi.mocked(cliUtils.startAppiumForCli).mockResolvedValue(mockProcess as any)

        mockPromisifiedTreeKill.mockResolvedValue(undefined)
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
        process.argv = ['node', 'appium-service.js', '--port=4723', '--custom-arg', 'value']

        await run()

        expect(cliUtils.extractPortFromCliArgs).toHaveBeenCalled()
        expect(cliUtils.determineAppiumCliCommand).toHaveBeenCalled()
        expect(cliUtils.startAppiumForCli).toHaveBeenCalledWith(
            '/path/to/appium',
            expect.arrayContaining([
                'server',
                '--port=4723',
                '--custom-arg',
                'value',
                '--log-timestamp',
                '--allow-cors'
            ])
        )
        expect(cliUtils.openBrowser).toHaveBeenCalledWith('https://inspector.appiumpro.com/')

        expect(console.log).toHaveBeenCalledWith('🚀 Starting Appium server...')
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('📡 Command:'))
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('/path/to/appium'))
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('server'))
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('--port=4723'))
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('--log-timestamp'))
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('--allow-cors'))
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
        process.argv = ['node', 'appium-service.js', '--port=4723', '--log-timestamp', '--allow-cors']

        await run()

        const args = vi.mocked(cliUtils.startAppiumForCli).mock.calls[0][1]
        const logTimestampCount = args.filter((arg: string) => arg === '--log-timestamp').length
        const allowCorsCount = args.filter((arg: string) => arg === '--allow-cors').length
        expect(logTimestampCount).toBe(1)
        expect(allowCorsCount).toBe(1)
    })

    it('should cleanup Appium process on SIGINT', async () => {
        mockPromisifiedTreeKill.mockClear()

        await run()

        const sigintHandler = vi.mocked(process.on).mock.calls.find(
            (call: any[]) => call[0] === 'SIGINT'
        )?.[1]

        await sigintHandler!()

        expect(console.log).toHaveBeenCalledWith('\n🛑 Stopping Appium server...')
        expect(mockPromisifiedTreeKill).toHaveBeenCalledWith(12345, 'SIGTERM')
        expect(console.log).toHaveBeenCalledWith('✅ Appium server stopped successfully')
        expect(process.exit).toHaveBeenCalledWith(0)
    })

    it('should cleanup Appium process on SIGTERM', async () => {
        mockPromisifiedTreeKill.mockClear()

        await run()

        const sigtermHandler = vi.mocked(process.on).mock.calls.find(
            (call: any[]) => call[0] === 'SIGTERM'
        )?.[1]

        expect(sigtermHandler).toBeDefined()
        await sigtermHandler!()

        expect(mockPromisifiedTreeKill).toHaveBeenCalledWith(12345, 'SIGTERM')
        expect(process.exit).toHaveBeenCalledWith(0)
    })

    it('should not cleanup multiple times if already cleaning up', async () => {
        await run()

        const sigintHandler = vi.mocked(process.on).mock.calls.find(
            (call: any[]) => call[0] === 'SIGINT'
        )?.[1]

        await sigintHandler!()
        const firstExitCallCount = vi.mocked(process.exit).mock.calls.length
        mockPromisifiedTreeKill.mockClear()
        await sigintHandler!()

        expect(mockPromisifiedTreeKill).not.toHaveBeenCalled()
        expect(vi.mocked(process.exit).mock.calls.length).toBe(firstExitCallCount)
    })

    it('should handle cleanup errors gracefully', async () => {
        mockPromisifiedTreeKill.mockRejectedValue(new Error('Kill failed'))

        await run()

        const sigintHandler = vi.mocked(process.on).mock.calls.find(
            (call: any[]) => call[0] === 'SIGINT'
        )?.[1]

        await sigintHandler!()

        expect(console.error).toHaveBeenCalledWith('Error stopping Appium:', expect.any(Error))
        expect(process.exit).toHaveBeenCalledWith(0)
    })

    it('should handle cleanup when process has no pid', async () => {
        mockProcess.pid = undefined

        await run()

        const sigintHandler = vi.mocked(process.on).mock.calls.find(
            (call: any[]) => call[0] === 'SIGINT'
        )?.[1]

        await sigintHandler!()

        expect(mockPromisifiedTreeKill).not.toHaveBeenCalled()
        expect(process.exit).toHaveBeenCalledWith(0)
    })

    it('should handle error when determineAppiumCliCommand throws', async () => {
        const error = new Error('Appium not found')
        vi.mocked(cliUtils.determineAppiumCliCommand).mockRejectedValue(error)

        await expect(run()).rejects.toThrow('Appium not found')
        expect(cliUtils.startAppiumForCli).not.toHaveBeenCalled()
        expect(cliUtils.openBrowser).not.toHaveBeenCalled()
    })

    it('should handle error when startAppiumForCli throws', async () => {
        const error = new Error('Failed to start Appium')
        vi.mocked(cliUtils.startAppiumForCli).mockRejectedValue(error)

        await expect(run()).rejects.toThrow('Failed to start Appium')
        expect(cliUtils.openBrowser).not.toHaveBeenCalled()
    })

    it('should handle error when openBrowser throws', async () => {
        const error = new Error('Failed to open browser')
        vi.mocked(cliUtils.openBrowser).mockRejectedValue(error)

        await expect(run()).rejects.toThrow('Failed to open browser')
    })
})
