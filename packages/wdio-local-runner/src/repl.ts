import type vm from 'node:vm'

import type { ReplConfig, ReplCallback } from '@wdio/repl'
import WDIORepl from '@wdio/repl'
import type { IsolatedProcess } from './processProxy.js'

export default class WDIORunnerRepl extends WDIORepl {
    childProcess: IsolatedProcess
    callback?: ReplCallback
    commandIsRunning = false

    constructor (childProcess: IsolatedProcess, options: ReplConfig) {
        super(options)
        this.childProcess = childProcess
    }

    private _getError (params: any) {
        if (!params.error) {
            return null
        }

        const err = new Error(params.message)
        err.stack = params.stack
        return err
    }

    eval (cmd: string, context: vm.Context, filename: string, callback: ReplCallback) {
        if (this.commandIsRunning) {
            return
        }

        this.commandIsRunning = true
        this.childProcess.send({
            origin: 'debugger',
            name: 'eval',
            content: { cmd }
        })

        this.callback = callback
    }

    onResult (params: any) {
        const error = this._getError(params)

        if (this.callback) {
            this.callback(error, params.result)
        }

        this.commandIsRunning = false
    }

    start (context?: vm.Context) {
        this.childProcess.send({
            origin: 'debugger',
            name: 'start'
        })

        return super.start(context)
    }
}
