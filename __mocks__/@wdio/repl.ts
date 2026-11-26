import { vi } from 'vitest'
import type repl from 'node:repl'

import type { ReplConfig } from '../../packages/wdio-repl/src'

export default class WDIORepl {
    static introMessage = 'some intro from mock'
    static createContext = vi.fn((locals: Record<string, unknown> = {}) => (
        Object.defineProperties({}, Object.getOwnPropertyDescriptors(locals))
    ))
    static formatResult = vi.fn((value: unknown) => String(value))
    private _config: ReplConfig
    private _isCommandRunning = false
    private _replServer: repl.REPLServer | undefined
    private _evalFn: (...args: unknown[]) => unknown
    private _startFn: (...args: unknown[]) => unknown

    constructor(config?: Partial<ReplConfig>) {
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

    eval(...args: unknown[]) {
        this._evalFn(...args)
    }

    start(...args: unknown[]) {
        return this._startFn(...args)
    }
}
