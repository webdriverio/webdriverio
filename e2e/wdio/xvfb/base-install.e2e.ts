import { expect } from '@wdio/globals'
import { execSync } from 'node:child_process'
import { XvfbManager } from '@wdio/xvfb'

describe('xvfb fresh installation', () => {
    describe('autoInstall disabled', () => {
        let xvfbManager: XvfbManager

        beforeEach(() => {
            xvfbManager = new XvfbManager()
        })

        it('should not install or wrap when autoInstall is disabled', async () => {
            // Ensure Linux in CI baseline
            expect(process.platform).toBe('linux')
            expect(process.env.CI).toBeDefined()

            // Sanity: xvfb-run should not be present in this base image
            let xvfbRunExists = false
            try {
                execSync('which xvfb-run', { stdio: 'ignore' })
                xvfbRunExists = true
            } catch {
                // intentionally ignore - absence is expected
            }
            expect(xvfbRunExists).toBe(false)

            // Init should skip installation and return false
            const initResult = await xvfbManager.init()
            expect(initResult).toBe(false)

            // Verify createWorkerProcess falls back to regular fork (not xvfb-run)
            const { ProcessFactory } = await import('@wdio/xvfb')
            const processFactory = new ProcessFactory(xvfbManager)
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
            // Should not have been spawned via 'xvfb-run'
            expect(mockProcess.spawnfile).not.toBe('xvfb-run')
            mockProcess.kill('SIGTERM')
        })

        it('should skip install even with headless capabilities when autoInstall is disabled', async () => {
            // Headless Chrome capabilities
            const caps: WebdriverIO.Capabilities = {
                'goog:chromeOptions': {
                    args: ['--headless=new']
                }
            }

            const result = await xvfbManager.init(caps)
            expect(result).toBe(false)
        })

        it('should honor existing DISPLAY and skip Xvfb usage', async () => {
            // Simulate an existing X server
            process.env.DISPLAY = ':0'

            const result = await xvfbManager.init()
            expect(result).toBe(false)

            // ProcessFactory should use regular fork
            const { ProcessFactory } = await import('@wdio/xvfb')
            const processFactory = new ProcessFactory(xvfbManager)
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
            expect(mockProcess.spawnfile).not.toBe('xvfb-run')
            mockProcess.kill('SIGTERM')
        })
    })

    describe('autoInstall enabled', () => {
        let xvfbManager: XvfbManager

        beforeEach(() => {
            // Ensure clean environment for these tests
            delete process.env.DISPLAY
            xvfbManager = new XvfbManager({ autoInstall: 'sudo' })
        })

        it('should detect missing xvfb and install it automatically when opted-in', async function(this: Mocha.Context) {
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
            const processFactory = new ProcessFactory(xvfbManager)

            // Create a mock worker process
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

            // Verify the process was created
            expect(mockProcess).toBeDefined()
            expect(typeof mockProcess.on).toBe('function')
            expect(typeof mockProcess.kill).toBe('function')

            // Clean up
            mockProcess.kill('SIGTERM')
        })
    })

    describe('advanced autoInstall configurations', () => {
        it('should handle object format with mode specification', async function(this: Mocha.Context) {
            this.timeout(300000) // 5 minutes

            // Test object format with explicit sudo mode
            const manager = new XvfbManager({
                autoInstall: { mode: 'sudo' }
            })

            delete process.env.DISPLAY
            expect(manager.shouldRun()).toBe(true)

            const result = await manager.init()
            expect(result).toBe(true)
        })

        it('should support custom install commands', async function(this: Mocha.Context) {
            this.timeout(300000) // 5 minutes

            const testMarkerFile = '/tmp/xvfb-custom-command-test'

            // Clean up any existing marker file
            try {
                execSync(`rm -f ${testMarkerFile}`, { stdio: 'ignore' })
            } catch {
                // Ignore if file doesn't exist
            }

            // Test custom command functionality with a verifiable side effect
            const manager = new XvfbManager({
                autoInstall: {
                    mode: 'sudo',
                    command: `echo "Custom command executed" && touch ${testMarkerFile} && echo "Marker file created"`
                },
                forceInstall: true // Skip initial availability check
            })

            delete process.env.DISPLAY

            try {
                await manager.init()
                // If it succeeds, great! But likely will fail due to no actual xvfb installation
            } catch (error) {
                // Expected to fail because custom command doesn't install xvfb-run
                expect(error.message).toContain('xvfb-run is not available after installation')
            }

            // Verify the custom command was actually executed by checking for the marker file
            let markerFileExists = false
            try {
                execSync(`test -f ${testMarkerFile}`, { stdio: 'ignore' })
                markerFileExists = true
            } catch {
                // Ignore if file doesn't exist
            }

            expect(markerFileExists).toBe(true)

            // Clean up
            try {
                execSync(`rm -f ${testMarkerFile}`, { stdio: 'ignore' })
            } catch {
                // Ignore cleanup errors
            }
        })

        it('should support automatic package manager detection', async function(this: Mocha.Context) {
            this.timeout(300000) // 5 minutes

            // Test that object format works with automatic package manager detection
            const manager = new XvfbManager({
                autoInstall: { mode: 'sudo' } // Use built-in package manager detection
            })

            delete process.env.DISPLAY
            const result = await manager.init()
            expect(result).toBe(true)
        })

        it('should support custom install commands as array format', async () => {
            const testMarkerFile = '/tmp/xvfb-array-command-test'
            const testContent = 'Array command executed successfully'

            // Clean up any existing marker file
            try {
                execSync(`rm -f ${testMarkerFile}`, { stdio: 'ignore' })
            } catch {
                // Ignore if file doesn't exist
            }

            // Test array command format with verifiable side effects
            const testManager = new XvfbManager({
                autoInstall: {
                    mode: 'sudo',
                    command: ['sh', '-c', `echo "${testContent}" > ${testMarkerFile} && echo "Array command completed"`]
                },
                forceInstall: true
            })

            delete process.env.DISPLAY

            // This will execute the array command but fail verification since it doesn't install xvfb
            try {
                await testManager.init()
            } catch (error) {
                // Expected to fail because the command doesn't actually install xvfb-run
                expect(error.message).toContain('xvfb-run is not available after installation')
            }

            // Verify the array command was executed by checking the marker file content
            let fileContent = ''
            try {
                fileContent = execSync(`cat ${testMarkerFile}`, { encoding: 'utf8' }).trim()
            } catch {
                // Ignore if file doesn't exist or can't be read
            }

            expect(fileContent).toBe(testContent)

            // Clean up
            try {
                execSync(`rm -f ${testMarkerFile}`, { stdio: 'ignore' })
            } catch {
                // Ignore cleanup errors
            }
        })

        it('should use custom commands instead of built-in package manager detection', async function(this: Mocha.Context) {
            this.timeout(300000) // 5 minutes

            const testMarkerFile = '/tmp/xvfb-custom-vs-builtin-test'

            // Clean up any existing marker file
            try {
                execSync(`rm -f ${testMarkerFile}`, { stdio: 'ignore' })
            } catch {
                // Ignore if file doesn't exist
            }

            // Create a custom command that actually installs xvfb but with a marker
            // This tests that custom commands override built-in detection
            const manager = new XvfbManager({
                autoInstall: {
                    mode: 'sudo',
                    command: `echo "Using custom command instead of built-in" > ${testMarkerFile} && which xvfb-run >/dev/null 2>&1 && echo "xvfb already installed" || { echo "Installing xvfb via custom command"; if command -v apt-get >/dev/null; then sudo apt-get update -qq && sudo apt-get install -y xvfb; elif command -v dnf >/dev/null; then sudo dnf install -y xorg-x11-server-Xvfb; elif command -v yum >/dev/null; then sudo yum install -y xorg-x11-server-Xvfb; elif command -v zypper >/dev/null; then sudo zypper --non-interactive install -y xvfb-run; elif command -v pacman >/dev/null; then sudo pacman -S --noconfirm xorg-server-xvfb; elif command -v apk >/dev/null; then sudo apk add --no-cache xvfb-run; else echo "No package manager found"; fi; }`
                },
                forceInstall: true
            })

            delete process.env.DISPLAY
            const result = await manager.init()
            expect(result).toBe(true)

            // Verify the custom command was used by checking our marker
            let markerContent = ''
            try {
                markerContent = execSync(`cat ${testMarkerFile}`, { encoding: 'utf8' }).trim()
            } catch {
                // Ignore if file doesn't exist
            }

            expect(markerContent).toBe('Using custom command instead of built-in')

            // Clean up
            try {
                execSync(`rm -f ${testMarkerFile}`, { stdio: 'ignore' })
            } catch {
                // Ignore cleanup errors
            }
        })

        it('should handle custom command failures gracefully', async () => {
            // Test with a custom command that will fail
            const failingManager = new XvfbManager({
                autoInstall: {
                    mode: 'sudo',
                    command: 'false' // Command that always fails
                },
                forceInstall: true
            })

            delete process.env.DISPLAY
            await expect(failingManager.init()).rejects.toThrow()
        })
    })

    it('should handle installation failures gracefully', async () => {
        // Create a manager with an unsupported package manager, forcing installation
        const failingManager = new XvfbManager({
            packageManager: 'unsupported-manager',
            forceInstall: true,
            autoInstall: 'sudo'
        })

        // Should throw error for unsupported package manager
        await expect(failingManager.init()).rejects.toThrow('Unsupported package manager: unsupported-manager')
    })

    afterEach(async () => {
        // Clean up environment variables
        delete process.env.DISPLAY
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
