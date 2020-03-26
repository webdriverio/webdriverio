const instances = []

export default class RunnerMock {
    constructor () {
        this.run = jest.fn().mockReturnValue(Promise.resolve({ foo: 'bar' }))
        this.on = jest.fn()
        instances.push(this)
    }
}

export { instances }
