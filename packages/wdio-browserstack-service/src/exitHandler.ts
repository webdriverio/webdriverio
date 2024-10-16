import { spawn } from 'node:child_process'
import path from 'node:path'
import BrowserStackConfig from './config.js'
import { saveFunnelData } from './instrumentation/funnelInstrumentation.js'
import { fileURLToPath } from 'node:url'
import { BROWSERSTACK_TESTHUB_JWT } from './constants.js'
import { BStackLogger } from './bstackLogger.js'

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
    process.on('exit', (code) => {
        BStackLogger.debug('Exit hook called')
        const args = shouldCallCleanup(BrowserStackConfig.getInstance())
        if (Array.isArray(args) && args.length) {
            BStackLogger.debug('Spawning cleanup with args ' + args.toString())
            const childProcess = spawn('node', [`${path.join(__dirname, 'cleanup.js')}`, ...args], { detached: true, stdio: 'inherit', env: { ...process.env } })
            childProcess.unref()
            process.exit(code)
        }
    })

    getInterruptSignals().forEach((sig: string) => {
        process.on(sig, () => {
            BrowserStackConfig.getInstance().setKillSignal(sig)
        })
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

    return args
}
