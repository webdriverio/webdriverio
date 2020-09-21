import repl from 'repl'

import { ReplConfig } from '../../../src'

export default class WDIORepl {
    static introMessage = 'some intro from mock'
    private _config: ReplConfig
    private _isCommandRunning = false
    private _replServer: repl.REPLServer | undefined
    private _evalFn: (...args: [any]) => any
    private _startFn: (...args: [any]) => any

    constructor(config: ReplConfig) {
        this._config = Object.assign({
            commandTimeout: 5000,
            eval: this.eval.bind(this),
            prompt: '\u203A ',
            useGlobal: true,
            useColor: true
        }, config)

        this._isCommandRunning = false
        this._evalFn = jest.fn()
        this._startFn = jest.fn().mockImplementation(
            () => new Promise(
                (resolve) => setTimeout(() => resolve(this), 100)))
    }

    eval(...args: [any]) {
        this._evalFn(...args)
    }

    start(...args: [any]) {
        return this._startFn(...args)
    }
}
