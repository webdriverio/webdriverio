export default class WDIORepl {
    static introMessage = 'some intro from mock'

    constructor (config) {
        this.config = Object.assign({
            commandTimeout: 5000,
            eval: ::this.eval,
            prompt: '\u203A ',
            useGlobal: true,
            useColor: true
        }, config)

        this.commandIsRunning = false
        this.evalFn = jest.fn()
        this.startFn = jest.fn().mockImplementation(
            () => new Promise(
                (resolve) => setTimeout(() => resolve(this), 100)))
    }

    eval (...args) {
        this.evalFn(...args)
    }

    start (...args) {
        return this.startFn(...args)
    }
}
