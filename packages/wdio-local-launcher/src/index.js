import path from 'path'
import child from 'child_process'
import EventEmitter from 'events'

export default class LocalLauncher extends EventEmitter {
    constructor (config) {
        super()
        this.config = config
    }

    run () {
        const {
            cid, command, configFile, argv, caps, processNumber,
            specs, server, isMultiremote
        } = this.config

        this.childProcess = child.fork(path.join(__dirname, '/runner.js'), process.argv.slice(2), {
            cwd: process.cwd(),
            execArgv: this.config.execArgv
        })

        this.childProcess
            .on('message', this.emit.bind(this, this.cid))
            .on('exit', this.emit.bind(this, this.cid))

        this.childProcess.send({
            cid, command, configFile, argv, caps,
            processNumber, specs, server, isMultiremote
        })
    }
}
