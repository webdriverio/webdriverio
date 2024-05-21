import { spawn } from 'node:child_process'
import path from 'node:path'
import os from 'node:os'
import BrowserStackConfig from './config.js'
import { saveFunnelData } from './instrumentation/funnelInstrumentation.js'
import { fileURLToPath } from 'node:url'
import { TESTOPS_JWT_ENV } from './constants.js'
import { BStackLogger } from './bstackLogger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function getSignalName(code?: number) : string|null {
    if (!code) {
        return null
    }
    // Handle case where exit code is returned as 128 + code
    if (code >= 128) {
        code -= 128
    }

    const signalEntry = Object.entries(os.constants.signals).find(e => e[1] === code)
    if (signalEntry) {
        return signalEntry[0]
    }

    return null
}

export function setupExitHandlers() {
    process.on('exit', (code) => {
        BStackLogger.debug('Exit hook called')
        const args = shouldCallCleanup(BrowserStackConfig.getInstance(), code)
        if (Array.isArray(args) && args.length) {
            BStackLogger.debug('Spawning cleanup with args ' + args.toString())
            const childProcess = spawn('node', [`${path.join(__dirname, 'cleanup.js')}`, ...args], { detached: true, stdio: 'inherit', env: { ...process.env } })
            childProcess.unref()
            process.exit(code)
        }
    })
}

export function shouldCallCleanup(config: BrowserStackConfig, exitCode?: number): string[] {
    const args: string[] = []
    if (!!process.env[TESTOPS_JWT_ENV] && !config.testObservability.buildStopped) {
        args.push('--observability')
    }

    if (config.userName && config.accessKey && !config.funnelDataSent) {
        const savedFilePath = saveFunnelData('SDKTestSuccessful', config, getSignalName(exitCode))
        args.push('--funnelData', savedFilePath)
    }

    return args
}
