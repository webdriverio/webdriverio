import path from 'path'
import child from 'child_process'
import EventEmitter from 'events'

import logger from 'wdio-logger'

const log = logger('wdio-local-runner')

export default class LocalRunner extends EventEmitter {
    constructor (config) {
        super()
        this.config = config
    }

    initialise () {}

    run (options) {
        const {
            cid, command, configFile, argv, caps, processNumber,
            specs, server, isMultiremote
        } = options

        const childProcess = child.fork(path.join(__dirname, 'run.js'), process.argv.slice(2), {
            cwd: process.cwd(),
            execArgv: this.config.execArgv
        })

        childProcess.on('message', this.emit.bind(this, this.cid))
        childProcess.on('exit', (code) => {
            log.debug(`Runner ${cid} finished with exit code ${code}`)
            this.emit(this.cid, code)
        })

        childProcess.send({
            cid, command, configFile, argv, caps,
            processNumber, specs, server, isMultiremote
        })
    }
}
