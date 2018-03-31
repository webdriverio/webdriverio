export default class CLIInterfaceMock {
    constructor () {
        this.clearLine = jest.fn()
        this.write = jest.fn()
        this.log = jest.fn()
        this.clearAll = jest.fn()
    }
}
