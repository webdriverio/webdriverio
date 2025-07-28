import { expect } from '@wdio/globals'
import { execSync } from 'node:child_process'
import { XvfbManager } from '@wdio/xvfb'

// Type definitions for Node.js internal methods
interface ProcessWithInternals extends NodeJS.Process {
    _getActiveHandles(): unknown[]
    _getActiveRequests(): unknown[]
}

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

        // Initialize xvfb - should detect existing installation
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

    it('should integrate correctly with ProcessFactory', async () => {
        // Initialize xvfb manager
        await xvfbManager.init()

        // Import and test ProcessFactory integration
        const { ProcessFactory } = await import('@wdio/local-runner')
        const processFactory = new ProcessFactory()

        // Verify that shouldRun() returns true (indicating xvfb should be used)
        expect(xvfbManager.shouldRun()).toBe(true)

        // Create a test process - this should use the spawn path with xvfb-run
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

        // Verify the mock process was created correctly
        expect(mockProcess).toBeDefined()
        expect(typeof mockProcess.on).toBe('function')
        expect(typeof mockProcess.kill).toBe('function')

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
        console.log('🧹 Starting afterEach cleanup...')

        // Log distribution info to understand differences
        try {
            const osInfo = execSync('cat /etc/os-release | grep "^NAME\\|^VERSION_ID"', { encoding: 'utf8' })
            console.log('🐧 Distribution during cleanup:', osInfo.trim())
        } catch {
            console.log('🐧 Could not determine distribution during cleanup')
        }

        // Check Chrome/Chromedriver versions and system dependencies
        try {
            const chromeVersion = execSync('/tmp/chrome/linux-*/chrome-linux64/chrome --version 2>/dev/null || echo "Chrome version unknown"', { encoding: 'utf8' })
            console.log(`🌐 Chrome version: ${chromeVersion.trim()}`)
        } catch {
            console.log('🌐 Could not determine Chrome version')
        }

        try {
            const chromedriverVersion = execSync('/tmp/chromedriver/linux-*/chromedriver-linux64/chromedriver --version 2>/dev/null || echo "Chromedriver version unknown"', { encoding: 'utf8' })
            console.log(`🚗 Chromedriver version: ${chromedriverVersion.trim()}`)
        } catch {
            console.log('🚗 Could not determine Chromedriver version')
        }

        // Check for missing system libraries that could cause Chrome crashes
        const requiredLibs = ['libnss3', 'libatk-bridge2.0-0', 'libx11-xcb1', 'libxcomposite1', 'libxcursor1', 'libxdamage1', 'libxi6', 'libxrandr2', 'libgbm1', 'libasound2']
        console.log('📚 Checking system libraries:')
        for (const lib of requiredLibs) {
            try {
                execSync(`ldconfig -p | grep -q ${lib}`, { stdio: 'pipe' })
                console.log(`  ✅ ${lib}: available`)
            } catch {
                console.log(`  ❌ ${lib}: missing`)
            }
        }

        // Check for resource limits and OOM killer activity
        try {
            const meminfo = execSync('cat /proc/meminfo | grep -E "MemTotal|MemAvailable"', { encoding: 'utf8' })
            console.log('💾 Memory info:')
            console.log(meminfo.trim())
        } catch {
            console.log('💾 Could not get memory info')
        }

        try {
            const oomKiller = execSync('dmesg | grep -i "killed process" | tail -5 || echo "No OOM killer activity"', { encoding: 'utf8' })
            console.log('💀 Recent OOM killer activity:')
            console.log(oomKiller.trim() || 'None found')
        } catch {
            console.log('💀 Could not check OOM killer logs')
        }

        // Check what Chrome processes are actually running
        let chromeProcessCount = '0'
        try {
            chromeProcessCount = execSync('ps aux | grep -E "(chrome|chromium)" | grep -v grep | wc -l', { encoding: 'utf8' }).trim()
            console.log(`🌐 Chrome processes count: ${chromeProcessCount}`)
        } catch (error) {
            console.log(error)
            console.log('🌐 Could not count Chrome processes (ps command likely missing like in Rocky)')
            console.log('⏩ This will skip process cleanup and prevent SIGTERM')
            chromeProcessCount = '0'
        }

        // Skip ALL process cleanup to prevent SIGTERM (proven fix from fresh-install tests)
        console.log('🚫 Skipping ALL Chrome and Xvfb process cleanup to prevent SIGTERM')
        console.log('✅ This fix was proven successful in fresh-install tests')

        // Wait for natural cleanup
        console.log('⏱️ Waiting for natural cleanup...')
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Log final process count
        try {
            const finalCount = execSync('ps aux | grep -E "(chrome|chromium)" | grep -v grep | wc -l', { encoding: 'utf8' })
            console.log(`🌐 Chrome processes after cleanup: ${finalCount.trim()}`)
        } catch {
            console.log('🌐 Could not count final Chrome processes')
        }

        // Log post-cleanup diagnostics
        console.log('📊 Post-cleanup diagnostics:')
        console.log(`- Active handles: ${(process as ProcessWithInternals)._getActiveHandles().length}`)
        console.log(`- Active requests: ${(process as ProcessWithInternals)._getActiveRequests().length}`)

        console.log('✅ afterEach cleanup completed')
    })
})
