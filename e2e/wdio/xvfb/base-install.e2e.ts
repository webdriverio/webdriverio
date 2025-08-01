import { expect } from '@wdio/globals'
import { execSync } from 'node:child_process'
import { XvfbManager } from '@wdio/xvfb'

describe('xvfb fresh installation', () => {
    let xvfbManager: XvfbManager

    beforeEach(() => {
        xvfbManager = new XvfbManager()
    })

    it('should detect missing xvfb and install it automatically', async function() {
        // Set a longer timeout for this test since it involves package installation
        this.timeout(300000) // 5 minutes

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
        const xvfbRunPath = execSync('which xvfb-run', { encoding: 'utf8' }).trim()
        expect(xvfbRunPath).toContain('xvfb-run')
        expect(xvfbRunPath.length).toBeGreaterThan(0)

        // Verify xvfb-run can execute successfully
        const testOutput = execSync('xvfb-run --help', { encoding: 'utf8' })
        expect(testOutput).toContain('xvfb-run')
    })

    it('should work with WebDriverIO local runner integration', async () => {
        // Ensure xvfb is initialized
        await xvfbManager.init()

        // Import ProcessFactory and test its behavior
        const { ProcessFactory } = await import('@wdio/xvfb')
        const processFactory = new ProcessFactory()

        // Create a mock worker process
        const mockProcess = processFactory.createWorkerProcess(
            '/mock/path/run.js',
            ['--test'],
            {
                cwd: process.cwd(),
                env: process.env as Record<string, string>,
                execArgv: [],
                stdio: ['inherit', 'pipe', 'pipe', 'ipc']
            }
        )

        // Verify the process was created
        expect(mockProcess).toBeDefined()
        expect(typeof mockProcess.on).toBe('function')
        expect(typeof mockProcess.kill).toBe('function')

        // Clean up
        mockProcess.kill('SIGTERM')
    })

    it('should handle installation failures gracefully', async () => {
        // Create a manager with an unsupported package manager, forcing installation
        const failingManager = new XvfbManager({
            packageManager: 'unsupported-manager',
            forceInstall: true
        })

        // Should throw error for unsupported package manager
        await expect(failingManager.init()).rejects.toThrow('Unsupported package manager: unsupported-manager')
    })

    afterEach(async () => {
        // Skip process cleanup to prevent SIGTERM
        await new Promise(resolve => setTimeout(resolve, 100))
    })

    after(() => {
        // Ensure clean exit
        setTimeout(() => {
            process.exit(0)
        }, 1000)
    })
})
