import { expect } from '@wdio/globals'
import { execSync } from 'node:child_process'
import { XvfbManager } from '@wdio/xvfb'

describe('xvfb existing installation', () => {
    let xvfbManager: XvfbManager

    beforeEach(() => {
        xvfbManager = new XvfbManager()
    })

    it('should detect existing xvfb installation', async () => {
        // Verify we're running on Linux in CI
        expect(process.platform).toBe('linux')
        expect(process.env.CI).toBeDefined()

        // Verify xvfb.shouldRun() returns true
        expect(xvfbManager.shouldRun()).toBe(true)

        // Verify xvfb-run is available (pre-installed in this container)
        let xvfbRunPath = ''
        try {
            xvfbRunPath = execSync('which xvfb-run', { encoding: 'utf8' }).trim()
        } catch (error) {
            throw new Error(`xvfb-run should be pre-installed: ${error}`)
        }
        expect(xvfbRunPath).toContain('xvfb-run')
        expect(xvfbRunPath.length).toBeGreaterThan(0)

        // Initialize xvfb - should detect existing installation and return true
        const initResult = await xvfbManager.init()
        expect(initResult).toBe(true)

        // Verify xvfb-run still works after init
        try {
            const testOutput = execSync('xvfb-run --help', { encoding: 'utf8' })
            expect(testOutput).toContain('xvfb-run')
        } catch (error) {
            throw new Error(`xvfb-run execution failed: ${error}`)
        }
    })

    it('should still detect existing xvfb when autoInstall is disabled', async () => {
        // reuse the default manager (autoInstall not set)
        expect(xvfbManager.shouldRun()).toBe(true)
        const initResult = await xvfbManager.init()
        expect(initResult).toBe(true)
    })

    it('should integrate correctly with ProcessFactory', async () => {
        // Initialize xvfb manager
        await xvfbManager.init()

        // Import and test ProcessFactory integration
        const { ProcessFactory } = await import('@wdio/xvfb')
        const processFactory = new ProcessFactory(xvfbManager)

        // Verify that shouldRun() returns true (indicating xvfb should be used)
        expect(xvfbManager.shouldRun()).toBe(true)

        // Create a test process - this should use the spawn path with xvfb-run
        const mockProcess = await processFactory.createWorkerProcess(
            '/mock/path/run.js',
            ['--test'],
            {
                cwd: process.cwd(),
                env: process.env as Record<string, string>,
                execArgv: [],
                stdio: ['inherit', 'pipe', 'pipe', 'ipc']
            }
        )

        // Verify the mock process was created correctly
        expect(mockProcess).toBeDefined()
        expect(typeof mockProcess.on).toBe('function')
        expect(typeof mockProcess.kill).toBe('function')

        // Optional: stronger assertion that xvfb-run is in use
        // Not all platforms expose spawnfile consistently, so check argv0 if available
        const procMeta = mockProcess as unknown as { spawnfile?: string, argv0?: string }
        const argv0 = procMeta.spawnfile || procMeta.argv0
        if (typeof argv0 === 'string') {
            expect(argv0.includes('xvfb-run') || argv0 === 'xvfb-run').toBe(true)
        }

        // Clean up
        mockProcess.kill('SIGTERM')
    })

    it('should handle xvfb-run command execution', async () => {
        // Initialize manager with existing xvfb
        await xvfbManager.init()

        // Test that we can execute a simple command under xvfb-run
        try {
            // Execute a basic command that should work under xvfb
            const result = execSync('xvfb-run --auto-servernum -- echo "test successful"', {
                encoding: 'utf8',
                timeout: 10000
            })
            expect(result.trim()).toBe('test successful')
        } catch (error) {
            throw new Error(`xvfb-run command execution failed: ${error}`)
        }
    })

    it('should work on different platforms appropriately', async () => {
        // Test platform detection logic
        if (process.platform === 'linux') {
            // On Linux, should always return true in CI
            expect(xvfbManager.shouldRun()).toBe(true)
        } else {
            // On non-Linux platforms, should return false
            expect(xvfbManager.shouldRun()).toBe(false)

            // Init should return false on non-Linux
            const result = await xvfbManager.init()
            expect(result).toBe(false)
        }
    })

    afterEach(async () => {
        // Skip process cleanup to prevent SIGTERM
        await new Promise(resolve => setTimeout(resolve, 100))
    })
})
