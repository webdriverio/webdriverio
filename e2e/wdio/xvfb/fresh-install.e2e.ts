import { expect } from '@wdio/globals'
import { execSync } from 'node:child_process'
import { XvfbManager } from '@wdio/xvfb'

describe('xvfb fresh installation', () => {
    let xvfbManager: XvfbManager

    before(() => {
        // Add signal handlers to debug termination
        process.on('SIGTERM', () => {
            console.log('🚨 SIGTERM received - process being terminated')
        })
        process.on('SIGINT', () => {
            console.log('🚨 SIGINT received - process being interrupted')
        })
        process.on('exit', (code) => {
            console.log(`🚨 Process exiting with code: ${code}`)
        })
    })

    beforeEach(() => {
        xvfbManager = new XvfbManager()
    })

    it('should detect missing xvfb and install it automatically', async function() {
        // Set a longer timeout for this test since it involves package installation
        this.timeout(300000) // 5 minutes
        console.log('🔍 Test body starting - checking environment...')
        console.log(`Platform: ${process.platform}`)
        console.log(`CI env: ${process.env.CI}`)

        // Verify we're running on Linux in CI
        console.log('✅ About to check platform expectation...')
        expect(process.platform).toBe('linux')
        console.log('✅ Platform check passed')

        console.log('✅ About to check CI environment...')
        expect(process.env.CI).toBeDefined()
        console.log('✅ CI environment check passed')

        // Verify xvfb.shouldRun() returns true
        console.log('✅ About to check xvfb shouldRun...')
        const shouldRun = xvfbManager.shouldRun()
        console.log(`shouldRun result: ${shouldRun}`)
        expect(shouldRun).toBe(true)
        console.log('✅ shouldRun check passed')

        // Verify xvfb-run is initially not available
        console.log('✅ About to check xvfb-run availability...')
        let xvfbRunExists = false
        try {
            execSync('which xvfb-run', { stdio: 'ignore' })
            xvfbRunExists = true
            console.log('⚠️ xvfb-run found unexpectedly')
        } catch {
            console.log('✅ xvfb-run not found as expected')
            // Expected - xvfb-run should not exist initially
        }
        expect(xvfbRunExists).toBe(false)
        console.log('✅ xvfb-run availability check passed')

        // Initialize xvfb - this should trigger installation
        console.log('🚀 About to initialize xvfb (this may take time for package installation)...')
        const initResult = await xvfbManager.init()
        console.log(`✅ xvfb init completed with result: ${initResult}`)
        expect(initResult).toBe(true)
        console.log('✅ xvfb init result check passed')

        // Verify xvfb-run is now available
        console.log('✅ About to verify xvfb-run installation...')
        let xvfbRunPath = ''
        try {
            xvfbRunPath = execSync('which xvfb-run', { encoding: 'utf8' }).trim()
            console.log(`✅ xvfb-run found at: ${xvfbRunPath}`)
        } catch (error) {
            console.error(`❌ xvfb-run not found after installation: ${error}`)
            throw new Error(`xvfb-run not found after installation: ${error}`)
        }
        expect(xvfbRunPath).toContain('xvfb-run')
        expect(xvfbRunPath.length).toBeGreaterThan(0)
        console.log('✅ xvfb-run path verification passed')

        // Verify xvfb-run can execute successfully
        console.log('✅ About to test xvfb-run execution...')
        try {
            const testOutput = execSync('xvfb-run --help', { encoding: 'utf8' })
            console.log('✅ xvfb-run --help executed successfully')
            expect(testOutput).toContain('xvfb-run')
            console.log('✅ xvfb-run help output verification passed')
        } catch (error) {
            console.error(`❌ xvfb-run execution failed: ${error}`)
            throw new Error(`xvfb-run execution failed: ${error}`)
        }

        console.log('🎉 All test assertions completed successfully!')
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
                env: process.env as Record<string, string>,
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
        // Create a manager with an unsupported package manager, forcing installation
        const failingManager = new XvfbManager({
            packageManager: 'unsupported-manager',
            forceInstall: true
        })

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
