import { vi } from 'vitest'

const instances: RunnerMock[] = []

export default class RunnerMock {
    public run = vi.fn().mockReturnValue(Promise.resolve({ foo: 'bar' }))
    public on = vi.fn()
    constructor () {
        instances.push(this)
    }
}

export { instances }
