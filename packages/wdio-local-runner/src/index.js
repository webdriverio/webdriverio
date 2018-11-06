import path from 'path'
import child from 'child_process'
import EventEmitter from 'events'

import logger from '@wdio/logger'
import RunnerTransformStream from './transformStream'

const log = logger('wdio-local-runner')

export default class LocalRunner extends EventEmitter {
    constructor (configFile, config) {
        super()
        this.configFile = configFile
        this.config = config
    }

    /**
     * nothing to initialise when running locally
     */
    initialise () {}

    run ({ cid, command, configFile, argv, caps, processNumber, specs, server, isMultiremote, execArgv }) {
        const runnerEnv = Object.assign(process.env, this.config.runnerEnv, {
            WDIO_LOG_LEVEL: this.config.logLevel
        })

        if (this.config.logDir) {
            runnerEnv.WDIO_LOG_PATH = path.join(this.config.logDir, `wdio-${cid}.log`)
        }

        log.info(`Start worker ${cid} with arg: ${process.argv.slice(2)}`)
        const childProcess = child.fork(path.join(__dirname, 'run.js'), process.argv.slice(2), {
            cwd: process.cwd(),
            env: runnerEnv,
            execArgv: execArgv,
            silent: true
        })

        childProcess.on('message',
            (payload) => this.emit('message', Object.assign(payload, { cid })))

        childProcess.on('exit', (code) => {
            log.debug(`Runner ${cid} finished with exit code ${code}`)
            this.emit('end', { cid, exitCode: code })
        })

        childProcess.send({
            cid, command, configFile, argv, caps,
            processNumber, specs, server, isMultiremote
        })


        childProcess.stdout.pipe(new RunnerTransformStream(cid)).pipe(process.stdout)
        childProcess.stderr.pipe(new RunnerTransformStream(cid)).pipe(process.stderr)

        return childProcess
    }
}
