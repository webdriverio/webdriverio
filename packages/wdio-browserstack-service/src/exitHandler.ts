import { spawn } from 'node:child_process'
import path from 'node:path'
import BrowserStackConfig from './config.js'
import { saveFunnelData } from './instrumentation/funnelInstrumentation.js'
import { fileURLToPath } from 'node:url'
import { BROWSERSTACK_TESTHUB_JWT } from './constants.js'
import { BStackLogger } from './bstackLogger.js'
import PerformanceTester from './instrumentation/performance/performance-tester.js'
import TestOpsConfig from './testOps/testOpsConfig.js'
import { BrowserstackCLI } from './cli/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function getInterruptSignals(): string[] {
    const allSignals: string[] = [
        'SIGTERM',
        'SIGINT',
        'SIGHUP'
    ]
    if (process.platform !== 'win32') {
        allSignals.push('SIGABRT')
        allSignals.push('SIGQUIT')
    } else {
        // For windows Ctrl+Break
        allSignals.push('SIGBREAK')
    }
    return allSignals
}

export function setupExitHandlers() {
    const handleCLICleanup = () => {
        BStackLogger.debug('Handling CLI cleanup in exit handler')
        try {
            const cliProcess = BrowserstackCLI.getInstance()?.process

            if (cliProcess && cliProcess.pid && cliProcess.exitCode === null) {
                BStackLogger.debug(`Found CLI process with PID ${cliProcess.pid}, terminating`)
                try {
                    if (process.platform === 'win32') {
                        cliProcess.kill('SIGTERM')
                        BStackLogger.debug('CLI process terminated successfully with SIGTERM (Windows)')
                    } else {
                        cliProcess.kill('SIGKILL')
                        BStackLogger.debug('CLI process terminated successfully with SIGKILL (Unix)')
                    }
                } catch (processError) {
                    BStackLogger.debug(`CLI process termination error: ${processError}`)
                    try {
                        cliProcess.kill()
                        BStackLogger.debug('CLI process terminated with default signal (fallback)')
                    } catch (fallbackError) {
                        BStackLogger.debug(`CLI process fallback termination error: ${fallbackError}`)
                    }
                }
            } else {
                BStackLogger.debug('No CLI process found to terminate')
            }
        } catch (error) {
            BStackLogger.debug(`Error in CLI cleanup: ${error}`)
        }
    }

    process.on('exit', () => {
        BStackLogger.debug('Exit handler called')

        handleCLICleanup()

        const args = shouldCallCleanup(BrowserStackConfig.getInstance())
        if (Array.isArray(args) && args.length) {
            BStackLogger.debug(`Spawning cleanup.js with args: ${args.join(', ')}`)
            const childProcess = spawn('node', [`${path.join(__dirname, 'cleanup.js')}`, ...args], {
                detached: true,
                stdio: 'ignore',
                env: { ...process.env }
            })
            childProcess.unref()
        }
    })

    getInterruptSignals().forEach((sig: string) => {
        process.on(sig, () => {
            BStackLogger.debug(`${sig} received, setting kill signal`)
            BrowserStackConfig.getInstance().setKillSignal(sig)
        })
    })

    BStackLogger.debug('Exit handlers registered')
}

export function shouldCallCleanup(config: BrowserStackConfig): string[] {
    const args: string[] = []
    if (!!process.env[BROWSERSTACK_TESTHUB_JWT] && !config.testObservability.buildStopped) {
        args.push('--observability')
    }

    if (config.userName && config.accessKey && !config.funnelDataSent) {
        const savedFilePath = saveFunnelData('SDKTestSuccessful', config)
        args.push('--funnelData', savedFilePath)
    }

    if (PerformanceTester.isEnabled()) {
        process.env.PERF_USER_NAME = config.userName
        process.env.PERF_TESTHUB_UUID = TestOpsConfig.getInstance().buildHashedId
        process.env.PERF_SDK_RUN_ID = config.sdkRunID
        args.push('--performanceData')
    }

    return args
}
