
/**
 *
 * This command helps you to debug your integration tests. It stops the running browser and gives
 * you time to jump into it and check the state of your application (e.g. using dev tools).
 * Your terminal transforms into a [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop)
 * interface that will allow you to try out certain commands, find elements and test actions on
 * them.
 *
 * [![WebdriverIO REPL](https://webdriver.io/img/repl.gif)](https://webdriver.io/img/repl.gif)
 *
 * If you run the WDIO testrunner make sure you increase the timeout property of the test framework
 * you are using (e.g. Mocha or Jasmine) in order to prevent test termination due to a test timeout.
 * Also avoid executing the command with multiple capabilities running at the same time.
 *
 * <iframe width="560" height="315" src="https://www.youtube.com/embed/xWwP-3B_YyE" frameBorder="0" allowFullScreen></iframe>
 *
 * <example>
    :debug.js
    it('should demonstrate the debug command', () => {
        $('#input').setValue('FOO')
        browser.debug() // jumping into the browser and change value of #input to 'BAR'
        const value = $('#input').getValue()
        console.log(value) // outputs: "BAR"
    })
 * </example>
 *
 * @alias browser.debug
 * @type utility
 *
 */

import vm from 'node:vm'
import repl from 'node:repl'

import { STATIC_RETURNS, INTRO_MESSAGE, DEFAULT_CONFIG } from './constants'

export interface ReplConfig {
    commandTimeout: number
    eval: repl.REPLEval
    prompt: string
    useGlobal: boolean
    useColor: boolean
}

export type ReplCallback = (err: Error | null, result: any) => void

export default class WDIORepl {
    static introMessage = INTRO_MESSAGE
    private _config: ReplConfig
    private _isCommandRunning = false
    private _replServer: repl.REPLServer | undefined

    constructor(config?: ReplConfig) {
        this._config = Object.assign(
            DEFAULT_CONFIG,
            { eval: this.eval.bind(this) },
            config
        )
    }

    eval (cmd: string, context: vm.Context, filename: string | undefined, callback: ReplCallback) {
        if (this._isCommandRunning) {
            return
        }

        if (cmd && STATIC_RETURNS[cmd.trim()]) {
            return callback(null, STATIC_RETURNS[cmd.trim()])
        }

        vm.createContext(context)
        this._isCommandRunning = true

        return this._runCmd(cmd, context, callback)
    }

    private _runCmd (cmd: string, context: vm.Context, callback: ReplCallback) {
        try {
            const result = vm.runInContext(cmd, context)
            return this._handleResult(result, callback)
        } catch (e: any) {
            this._isCommandRunning = false
            return callback(e, undefined)
        }
    }

    private _handleResult (result: any, callback: ReplCallback) {
        if (!result || typeof result.then !== 'function') {
            this._isCommandRunning = false
            return callback(null, result)
        }

        let timeoutCalled = false
        const timeout = setTimeout(
            () => {
                callback(new Error('Command execution timed out'), undefined)
                this._isCommandRunning = false
                timeoutCalled = true
            },
            this._config.commandTimeout
        )

        result.then((res: any) => {
            /**
             * don't do anything if timeout was called
             */
            if (timeoutCalled) {
                return
            }
            this._isCommandRunning = false
            clearTimeout(timeout)
            return callback(null, res)
        }, (e: Error) => {
            /**
             * don't do anything if timeout was called
             */
            if (timeoutCalled) {
                return
            }

            this._isCommandRunning = false
            clearTimeout(timeout)
            const errorMessage = e ? e.message : 'Command execution timed out'
            const commandError = new Error(errorMessage)
            delete commandError.stack
            return callback(commandError, undefined)
        })
    }

    start (context?: vm.Context) {
        if (this._replServer) {
            throw new Error('a repl was already initialised')
        }

        if (context) {
            const evalFn = this._config.eval
            this._config.eval = function (cmd, _, filename, callback) {
                return evalFn.call(this, cmd, context, filename, callback)
            }
        }

        this._replServer = repl.start(this._config)

        return new Promise((resolve) => {
            return (this._replServer as repl.REPLServer).on('exit', resolve)
        })
    }
}
