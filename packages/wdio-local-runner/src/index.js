import fs from 'fs'
import path from 'path'
import child from 'child_process'
import EventEmitter from 'events'

import logger from 'wdio-logger'

const log = logger('wdio-local-runner')

export default class LocalRunner extends EventEmitter {
    constructor (configFile, config) {
        super()
        this.configFile = configFile
        this.config = config
    }

    initialise () {}

    run (options) {
        const {
            cid, command, configFile, argv, caps, processNumber,
            specs, server, isMultiremote
        } = options
        const logFile = fs.createWriteStream(path.join(this.config.logDir, `wdio-${cid}.log`))
        const runnerEnv = Object.assign(this.config.runnerEnv, {
            WDIO_LOG_LEVEL: this.config.logLevel
        })

        const childProcess = child.fork(path.join(__dirname, 'run.js'), process.argv.slice(2), {
            cwd: process.cwd(),
            env: runnerEnv,
            execArgv: this.config.execArgv,
            silent: true
        })

        childProcess.on('message', this.emit.bind(this, this.cid))
        childProcess.on('exit', (code) => {
            log.debug(`Runner ${cid} finished with exit code ${code}`)
            this.emit('end', { cid, exitCode: code })
        })

        childProcess.send({
            cid, command, configFile, argv, caps,
            processNumber, specs, server, isMultiremote
        })

        childProcess.stdout.pipe(logFile)
        childProcess.stderr.pipe(logFile)
    }
}
