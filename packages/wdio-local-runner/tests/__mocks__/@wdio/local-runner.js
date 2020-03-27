export default class LocalRunnerMock {
    constructor (configFile, config) {
        this.configFile = configFile
        this.config = config
        this.workerPool = {}
        this.initialise = jest.fn()
        this.run = jest.fn()
    }

    run ({ command, args, ...options }) {
        this.workerPool[options.cid] = { postMessage: jest.fn() }
        this.workerPool[options.cid].postMessage(command, args)
        return this.workerPool[options.cid]
    }
}
