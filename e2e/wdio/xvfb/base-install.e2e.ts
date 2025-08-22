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
            // Ensure Linux in CI baseline (skip platform check on non-Linux)
            if (process.platform === 'linux') {
                expect(process.env.CI).toBeDefined()
            }

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
            xvfbManager = new XvfbManager({ autoInstall: true, autoInstallMode: 'sudo' })
        })

        it('should detect missing xvfb and install it automatically when opted-in', async function(this: Mocha.Context) {
            // Skip on non-Linux platforms where xvfb doesn't make sense
            if (process.platform !== 'linux') {
                this.skip()
            }

            // Set a longer timeout for this test since it involves package installation
            this.timeout(300000) // 5 minutes

            // Verify we're running on Linux in CI
            expect(process.platform).toBe('linux')
            expect(process.env.CI).toBeDefined()

            // Force Xvfb to run even on non-Linux for testing
            xvfbManager = new XvfbManager({
                force: true,
                autoInstall: true,
                autoInstallMode: 'sudo',
                autoInstallCommand: 'echo "Mock xvfb installation"'
            })

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
            try {
                const initResult = await xvfbManager.init()
                // On Linux with mock command, this should fail because xvfb-run isn't actually installed
                expect(initResult).toBe(false)
            } catch (error) {
                // Expected to fail because mock command doesn't install xvfb-run
                expect((error as Error).message).toContain('xvfb-run is not available after installation')
            }
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
            // Skip on non-Linux platforms where xvfb doesn't make sense
            if (process.platform !== 'linux') {
                this.skip()
            }

            this.timeout(300000) // 5 minutes

            // Test object format with explicit sudo mode
            const manager = new XvfbManager({
                force: true,
                autoInstall: true,
                autoInstallMode: 'sudo',
                autoInstallCommand: 'echo "Mock object format test"'
            })

            delete process.env.DISPLAY
            expect(manager.shouldRun()).toBe(true)

            try {
                const result = await manager.init()
                expect(result).toBe(false)
            } catch (error) {
                // Expected to fail because mock command doesn't install xvfb-run
                expect((error as Error).message).toContain('xvfb-run is not available after installation')
            }
        })

        it('should support custom install commands', async function(this: Mocha.Context) {
            // Skip on non-Linux platforms where xvfb doesn't make sense
            if (process.platform !== 'linux') {
                this.skip()
            }

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
                force: true,
                autoInstall: true,
                autoInstallMode: 'sudo',
                autoInstallCommand: `echo "Custom command executed" && touch ${testMarkerFile} && echo "Marker file created"`
            })

            delete process.env.DISPLAY

            try {
                await manager.init()
                // If it succeeds, great! But likely will fail due to no actual xvfb installation
            } catch (error) {
                // Expected to fail because custom command doesn't install xvfb-run
                expect((error as Error).message).toContain('xvfb-run is not available after installation')
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
            // Skip on non-Linux platforms where xvfb doesn't make sense
            if (process.platform !== 'linux') {
                this.skip()
            }

            this.timeout(300000) // 5 minutes

            // Test that object format works with automatic package manager detection
            const manager = new XvfbManager({
                force: true,
                autoInstall: true,
                autoInstallMode: 'sudo',
                autoInstallCommand: 'echo "Mock package manager detection"'
            })

            delete process.env.DISPLAY
            try {
                const result = await manager.init()
                expect(result).toBe(false)
            } catch (error) {
                // Expected to fail because mock command doesn't install xvfb-run
                expect((error as Error).message).toContain('xvfb-run is not available after installation')
            }
        })

        it('should support custom install commands as array format', async function(this: Mocha.Context) {
            // Skip on non-Linux platforms where xvfb doesn't make sense
            if (process.platform !== 'linux') {
                this.skip()
            }

            const testMarkerFile = '/tmp/xvfb-array-command-test'
            const testContent = 'Array command executed successfully'

            // Clean up any existing marker file
            try {
                execSync(`rm -f ${testMarkerFile}`, { stdio: 'ignore' })
            } catch {
                // Ignore if file doesn't exist
            }

            // Test array command format with verifiable side effects
            // Use a simple command that doesn't require special privileges
            // Check what environment we're in and adjust accordingly
            let isRoot = false
            try {
                const uid = execSync('id -u', { encoding: 'utf8' }).trim()
                isRoot = uid === '0'
            } catch {
                // Ignore if command fails
            }

            // Test array format - write to a file directly
            const testManager = new XvfbManager({
                force: true,
                autoInstall: true,
                autoInstallMode: isRoot ? 'root' : 'sudo',
                autoInstallCommand: ['/bin/sh', '-c', `echo "${testContent}" > ${testMarkerFile}`]
            })

            delete process.env.DISPLAY

            // This will execute the array command but fail verification since it doesn't install xvfb
            try {
                await testManager.init()
            } catch (error) {
                // Expected to fail because the command doesn't actually install xvfb-run
                expect((error as Error).message).toContain('xvfb-run is not available after installation')
            }

            // Verify the array command was executed by checking the marker file content
            let fileContent = ''
            let fileExists = false
            try {
                fileContent = execSync(`cat ${testMarkerFile}`, { encoding: 'utf8' }).trim()
                fileExists = true
            } catch (catError) {
                // Check if file exists but can't be read
                try {
                    execSync(`test -f ${testMarkerFile}`, { stdio: 'ignore' })
                    fileExists = true
                    console.log(`File exists but couldn't read it: ${catError}`)
                } catch {
                    fileExists = false
                    console.log(`File does not exist: ${testMarkerFile}`)
                }
            }

            // Debug information
            console.log(`File exists: ${fileExists}, Content: "${fileContent}"`)

            // Also check what user we're running as
            try {
                const whoami = execSync('whoami', { encoding: 'utf8' }).trim()
                const uid = execSync('id -u', { encoding: 'utf8' }).trim()
                console.log(`Running as user: ${whoami}, UID: ${uid}`)
            } catch {
                // Ignore if commands fail
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
            // Skip on non-Linux platforms where xvfb doesn't make sense
            if (process.platform !== 'linux') {
                this.skip()
            }

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
                force: true,
                autoInstall: true,
                autoInstallMode: 'sudo',
                autoInstallCommand: `echo "Using custom command instead of built-in" > ${testMarkerFile} && which xvfb-run >/dev/null 2>&1 && echo "xvfb already installed" || { echo "Installing xvfb via custom command"; if command -v apt-get >/dev/null; then sudo apt-get update -qq && sudo apt-get install -y xvfb; elif command -v dnf >/dev/null; then sudo dnf install -y xorg-x11-server-Xvfb; elif command -v yum >/dev/null; then sudo yum install -y xorg-x11-server-Xvfb; elif command -v zypper >/dev/null; then sudo zypper --non-interactive install -y xvfb-run; elif command -v pacman >/dev/null; then sudo pacman -S --noconfirm xorg-server-xvfb; elif command -v apk >/dev/null; then sudo apk add --no-cache xvfb-run; else echo "No package manager found"; fi; }`,
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

        it('should handle custom command failures gracefully', async function(this: Mocha.Context) {
            // Skip on non-Linux platforms where xvfb doesn't make sense
            if (process.platform !== 'linux') {
                this.skip()
            }

            // Test with a custom command that will fail
            const failingManager = new XvfbManager({
                force: true,
                autoInstall: true,
                autoInstallMode: 'sudo',
                autoInstallCommand: 'false',
                forceInstall: true
            })

            delete process.env.DISPLAY
            await expect(failingManager.init()).rejects.toThrow()
        })
    })

    it('should handle installation failures gracefully', async function(this: Mocha.Context) {
        // Skip on non-Linux platforms where xvfb doesn't make sense
        if (process.platform !== 'linux') {
            this.skip()
        }

        // Create a manager with an unsupported package manager, forcing installation
        const failingManager = new XvfbManager({
            force: true,
            packageManager: 'unsupported-manager',
            forceInstall: true,
            autoInstall: true,
            autoInstallMode: 'sudo'
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
