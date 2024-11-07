import { spawn } from 'node:child_process'
import path from 'node:path'
import BrowserStackConfig from './config'
import { saveFunnelData } from './instrumentation/funnelInstrumentation'
import { TESTOPS_JWT_ENV } from './constants'
import { BStackLogger } from './bstackLogger'

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
}

export function shouldCallCleanup(config: BrowserStackConfig): string[] {
    const args: string[] = []
    if (!!process.env[TESTOPS_JWT_ENV] && !config.testObservability.buildStopped) {
        args.push('--observability')
    }

    if (config.userName && config.accessKey && !config.funnelDataSent) {
        const savedFilePath = saveFunnelData('SDKTestSuccessful', config)
        args.push('--funnelData', savedFilePath)
    }

    return args
}
