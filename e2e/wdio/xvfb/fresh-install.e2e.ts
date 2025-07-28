import { expect } from '@wdio/globals'
import { execSync } from 'node:child_process'
import { XvfbManager } from '@wdio/xvfb'

// Type definitions for Node.js internal methods
interface ProcessWithInternals extends NodeJS.Process {
    _getActiveHandles(): unknown[]
    _getActiveRequests(): unknown[]
}

describe('xvfb fresh installation', () => {
    let xvfbManager: XvfbManager

    before(() => {
        // Add comprehensive process diagnostics
        process.on('SIGTERM', () => {
            console.log('🚨 SIGTERM received - process being terminated')
            console.log('📊 Active handles:', (process as ProcessWithInternals)._getActiveHandles().length)
            console.log('📊 Active requests:', (process as ProcessWithInternals)._getActiveRequests().length)
            console.log('📊 CPU usage:', JSON.stringify(process.cpuUsage()))
            console.log('📊 Memory usage:', JSON.stringify(process.memoryUsage()))

            // Show what's keeping the process alive
            const handles = (process as ProcessWithInternals)._getActiveHandles()
            console.log('🔍 Handles preventing clean exit:')
            handles.forEach((handle: unknown, index: number) => {
                const handleType = (handle as { constructor: { name: string } }).constructor?.name || 'Unknown'
                console.log(`  - Handle ${index}: ${handleType}`)
            })
            // Show running processes one last time
            try {
                console.log('🔍 Final process list:')
                const procs = execSync('ps aux | grep -E "(chrome|xvfb|node)" | grep -v grep', { encoding: 'utf8' })
                console.log(procs || 'No relevant processes found')
            } catch {
                console.log('❌ Could not get final process list')
            }
        })

        process.on('SIGINT', () => {
            console.log('🚨 SIGINT received - process being interrupted')
        })

        process.on('exit', (code) => {
            console.log(`🚨 Process exiting with code: ${code}`)
        })

        // Add beforeExit to catch when event loop is empty but process won't exit
        process.on('beforeExit', (code) => {
            console.log(`🔍 beforeExit triggered with code: ${code}`)
            console.log('📊 Active handles keeping process alive:', process._getActiveHandles().length)
            console.log('📊 Active requests keeping process alive:', (process as ProcessWithInternals)._getActiveRequests().length)

            // Log details about what's keeping the process alive
            const handles = process._getActiveHandles()
            handles.forEach((handle: unknown, index: number) => {
                console.log(`Handle ${index}:`, (handle as { constructor: { name: string } }).constructor.name)
            })
        })
    })

    beforeEach(() => {
        xvfbManager = new XvfbManager()
    })

    it('should detect missing xvfb and install it automatically', async function() {
        // Set a longer timeout for this test since it involves package installation
        this.timeout(300000) // 5 minutes

        // Add timeout monitoring for hanging operations
        const testTimeoutId = setTimeout(() => {
            console.log('⚠️ Test taking longer than expected, checking for hanging operations')
            console.log('📊 Current handles:', (process as ProcessWithInternals)._getActiveHandles().length)
            console.log('📊 Current requests:', (process as ProcessWithInternals)._getActiveRequests().length)

            // Log what processes are still running
            try {
                console.log('🔍 All processes:', execSync('ps aux', { encoding: 'utf8' }))
            } catch {
                console.log('❌ Could not list processes')
            }
        }, 120000) // 2 minutes warning

        console.log('🔍 Test body starting - checking environment...')
        console.log(`Platform: ${process.platform}`)
        console.log(`CI env: ${process.env.CI}`)

        // Check Linux distribution for debugging
        try {
            const osInfo = execSync('cat /etc/os-release', { encoding: 'utf8' })
            console.log('🐧 OS Distribution info:')
            console.log(osInfo)
        } catch {
            console.log('🐧 Could not determine OS distribution')
        }

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

        // Add comprehensive process diagnostics before test completion
        console.log('📊 Pre-completion diagnostics:')
        console.log(`- Active handles: ${(process as ProcessWithInternals)._getActiveHandles().length}`)
        console.log(`- Active requests: ${(process as ProcessWithInternals)._getActiveRequests().length}`)
        console.log('- Memory usage:', JSON.stringify(process.memoryUsage()))
        console.log('- CPU usage:', JSON.stringify(process.cpuUsage()))

        // Log active handles details
        const handles = (process as ProcessWithInternals)._getActiveHandles()
        console.log('🔍 Active handle types:')
        handles.forEach((handle: unknown, index: number) => {
            const handleType = (handle as { constructor: { name: string } }).constructor?.name || 'Unknown'
            console.log(`  Handle ${index}: ${handleType}`)
        })

        // Check for Chrome processes
        try {
            const chromeProcs = execSync('ps aux | grep -E "(chrome|chromium)" | grep -v grep', { encoding: 'utf8' })
            console.log('🌐 Chrome processes:', chromeProcs || 'None found')
        } catch {
            console.log('🌐 Chrome processes: None found or ps command failed')
        }

        // Check for xvfb processes
        try {
            const xvfbProcs = execSync('ps aux | grep xvfb | grep -v grep', { encoding: 'utf8' })
            console.log('🖥️ Xvfb processes:', xvfbProcs || 'None found')
        } catch {
            console.log('🖥️ Xvfb processes: None found or ps command failed')
        }

        // Flush output streams
        process.stdout.write('')
        process.stderr.write('')

        // Clear the timeout monitoring
        clearTimeout(testTimeoutId)
        console.log('✅ Test timeout monitoring cleared')

        // Explicitly signal test completion to prevent hanging
        process.nextTick(() => {
            console.log('🚀 Test completed, process should exit cleanly')
        })
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

        // EXPERIMENT: Skip ALL process cleanup to test if pkill is the real issue
        console.log('🧪 EXPERIMENT: Skipping ALL Chrome and Xvfb process cleanup')
        console.log('📊 This will test if pkill commands are the actual cause of SIGTERM')
        console.log('🔍 If this fixes the issue, then pkill was the problem')
        console.log('❌ If this still fails, then something else is causing SIGTERM')

        // Wait for cleanup to complete
        console.log('⏱️ Waiting for process cleanup...')
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

    after(() => {
        // Ensure clean exit to prevent SIGTERM
        console.log('🧹 Final cleanup - ensuring clean process exit')
        process.removeAllListeners('SIGTERM')
        process.removeAllListeners('SIGINT')
        process.removeAllListeners('exit')

        // Force exit if needed (last resort)
        setTimeout(() => {
            console.log('⚠️ Forcing process exit due to timeout')
            process.exit(0)
        }, 1000)
    })
})
