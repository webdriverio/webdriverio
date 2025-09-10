import { spawn } from 'node:child_process'
import path from 'node:path'
import BrowserStackConfig from './config.js'
import { saveFunnelData } from './instrumentation/funnelInstrumentation.js'
import { fileURLToPath } from 'node:url'
import { BROWSERSTACK_TESTHUB_JWT } from './constants.js'
import PerformanceTester from './instrumentation/performance/performance-tester.js'
import TestOpsConfig from './testOps/testOpsConfig.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function setupExitHandlers() {
    process.on('exit', (code) => {
        const args = shouldCallCleanup(BrowserStackConfig.getInstance())
        if (Array.isArray(args) && args.length) {
            const childProcess = spawn('node', [`${path.join(__dirname, 'cleanup.js')}`, ...args], { detached: true, stdio: 'inherit', env: { ...process.env } })
            childProcess.unref()
            process.exit(code)
        }
    })
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
        process.env.SDK_RUN_ID = config.sdkRunID
        args.push('--performanceData')
    }

    return args
}
