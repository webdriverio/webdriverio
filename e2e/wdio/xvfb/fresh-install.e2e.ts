import { expect } from '@wdio/globals'
import { execSync } from 'node:child_process'
import { XvfbManager } from '@wdio/xvfb'

describe('xvfb fresh installation', () => {
    let xvfbManager: XvfbManager

    beforeEach(() => {
        xvfbManager = new XvfbManager()
    })

    it('should detect missing xvfb and install it automatically', async () => {
        // Verify we're running on Linux in CI
        expect(process.platform).toBe('linux')
        expect(process.env.CI).toBeDefined()

        // Verify xvfb.shouldRun() returns true
        expect(xvfbManager.shouldRun()).toBe(true)

        // Verify xvfb-run is initially not available
        let xvfbRunExists = false
        try {
            execSync('which xvfb-run', { stdio: 'ignore' })
            xvfbRunExists = true
        } catch {
            // Expected - xvfb-run should not exist initially
        }
        expect(xvfbRunExists).toBe(false)

        // Initialize xvfb - this should trigger installation
        const initResult = await xvfbManager.init()
        expect(initResult).toBe(true)

        // Verify xvfb-run is now available
        let xvfbRunPath = ''
        try {
            xvfbRunPath = execSync('which xvfb-run', { encoding: 'utf8' }).trim()
        } catch (error) {
            throw new Error(`xvfb-run not found after installation: ${error}`)
        }
        expect(xvfbRunPath).toContain('xvfb-run')
        expect(xvfbRunPath.length).toBeGreaterThan(0)

        // Verify xvfb-run can execute successfully
        try {
            const testOutput = execSync('xvfb-run --help', { encoding: 'utf8' })
            expect(testOutput).toContain('xvfb-run')
        } catch (error) {
            throw new Error(`xvfb-run execution failed: ${error}`)
        }
    })

    it('should work with WebDriverIO local runner integration', async () => {
        // This test verifies that the ProcessFactory correctly uses xvfb
        // after installation by importing and testing the local runner

        // Ensure xvfb is initialized
        await xvfbManager.init()

        // Import ProcessFactory and test its behavior
        const { ProcessFactory } = await import('@wdio/local-runner')
        const processFactory = new ProcessFactory()

        // Create a mock worker process
        const mockProcess = processFactory.createWorkerProcess(
            '/mock/path/run.js',
            ['--test'],
            {
                cwd: process.cwd(),
                env: process.env,
                execArgv: [],
                stdio: ['inherit', 'pipe', 'pipe', 'ipc']
            }
        )

        // Verify the process was created (we can't test actual execution in this context)
        expect(mockProcess).toBeDefined()
        expect(typeof mockProcess.on).toBe('function')
        expect(typeof mockProcess.kill).toBe('function')

        // Clean up
        mockProcess.kill('SIGTERM')
    })

    it('should handle installation failures gracefully', async () => {
        // Create a manager that will fail installation by simulating unsupported package manager
        const failingManager = new (class extends XvfbManager {
            // Override detectPackageManager to return unsupported package manager
            protected async detectPackageManager(): Promise<string> {
                return 'unsupported-manager'
            }
        })()

        // Should throw error for unsupported package manager
        await expect(failingManager.init()).rejects.toThrow('Unsupported package manager: unsupported-manager')
    })

    afterEach(() => {
        // Clean up any processes
        try {
            execSync('pkill -f xvfb', { stdio: 'ignore' })
        } catch {
            // Ignore cleanup errors
        }
    })
})