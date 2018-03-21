import EventEmitter from 'events'
import CLIInterface from 'wdio-interface'

export default class WDIOCLIInterface extends EventEmitter {
    constructor (config) {
        super()
        this.config = config
        this.jobs = []

        this.interface = new CLIInterface()
        this.on('job:start', ::this.addJob)
        this.on('job:end', ::this.clearJob)
    }

    addJob({ cid, caps, specs }) {
        this.interface.log(11, 44, { cid, caps, specs })
        this.interface.log(22, 'foobar')
        this.interface.log(33, 'looo')
    }

    clearJob ({ cid, passed }) {
        this.interface.log(11, { cid, passed })
    }
}
