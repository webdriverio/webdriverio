export default class CLInterfaceMock {
    constructor () {
        this.clearLine = jest.fn()
        this.write = jest.fn()
        this.log = jest.fn()
        this.clearAll = jest.fn()
        this.clearBuffer = jest.fn()
        this.stdoutBuffer = []
        this.stderrBuffer = []
    }
}
