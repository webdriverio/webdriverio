import WorkerInstance from '../../../src/worker'

export default class LocalRunnerMock {
    configFile: string
    config: WebdriverIO.Config
    workerPool: Record<string, WorkerInstance> = {}
    initialise = jest.fn()

    constructor (configFile: string, config: WebdriverIO.Config) {
        this.configFile = configFile
        this.config = config
    }

    run ({ command, args, ...options }: any) {
        this.workerPool[options.cid as string] = { postMessage: jest.fn() } as unknown as WorkerInstance
        this.workerPool[options.cid].postMessage(command, args)
        return this.workerPool[options.cid]
    }
}
