import { vi } from 'vitest'
import repl from 'node:repl'

import { ReplConfig } from '../../packages/wdio-repl/src'

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
        this._evalFn = vi.fn()
        this._startFn = vi.fn().mockImplementation(
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
