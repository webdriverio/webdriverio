import path from 'path'
import child from 'child_process'
import EventEmitter from 'events'

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

        childProcess
            .on('message', this.emit.bind(this, this.cid))
            .on('exit', this.emit.bind(this, this.cid))

        childProcess.send({
            cid, command, configFile, argv, caps,
            processNumber, specs, server, isMultiremote
        })
    }
}
