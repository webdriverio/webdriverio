const instances: RunnerMock[] = []

export default class RunnerMock {
    public run = jest.fn().mockReturnValue(Promise.resolve({ foo: 'bar' }))
    public on = jest.fn()
    constructor () {
        instances.push(this)
    }
}

export { instances }
