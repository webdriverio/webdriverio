import { vi } from 'vitest'
import type WorkerInstance from '../../packages/wdio-local-runner/src/worker'

export default class LocalRunnerMock {
    configFile: string
    config: WebdriverIO.Config
    workerPool: Record<string, WorkerInstance> = {}
    initialise = vi.fn()

    constructor (configFile: string, config: WebdriverIO.Config) {
        this.configFile = configFile
        this.config = config
    }

    run ({ command, args, ...options }: any) {
        this.workerPool[options.cid as string] = { postMessage: vi.fn() } as unknown as WorkerInstance
        this.workerPool[options.cid].postMessage(command, args)
        return this.workerPool[options.cid]
    }
}
