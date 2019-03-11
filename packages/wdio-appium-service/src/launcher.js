import logger from '@wdio/logger'
import { promisify } from 'util'
import { spawn } from 'child_process'

const log = logger('@wdio/appium-service')

export default class AppiumLauncher {
    async onPrepare (config) {
        const asyncStartAppium = promisify(this._startAppium)
        this.process = await asyncStartAppium()
    }

    onComplete () {
        if(this.process) {
            log.debug(`Appium (pid: ${process.pid}) killed`)
            this.process.kill()
        }
    }

    _startAppium(callback) {
        const appiumCommand = 'appium'
        const appiumArgs = []
        log.debug(`Will spawn Appium process: ${appiumCommand} ${appiumArgs.join(' ')}`);
        let process = spawn(appiumCommand, appiumArgs, { stdio: ['ignore', 'pipe', 'pipe'] })
        let exited = null

        const exitCallback = (exitCode) => {
            clearTimeout(timer)
            exited = exitCode
            callback(new Error(`Appium exited before timeout (exit code: ${exitCode})`), null)
        }

        const timer = setTimeout(() => {
            process.removeListener('exit', exitCallback)
            if (exited === null) {
                log.debug(`Appium started with ID: ${process.pid}`)
                return callback(null, process)
            }
        }, 5000)

        process.once('exit', callback)
    }
}
