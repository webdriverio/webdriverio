import WDIORepl from '@wdio/repl'

export default class WDIORunnerRepl extends WDIORepl {
    constructor (childProcess, options) {
        super(options)
        this.childProcess = childProcess
        this.commandIsRunning = false
    }

    _getError(params) {
        if (!params.error) {
            return null
        }

        const err = new Error(params.message)
        err.stack = params.stack
        return err
    }

    eval (cmd, context, filename, callback) {
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

    onResult (params) {
        const error = this._getError(params)
        this.callback(error, params.result)
        this.commandIsRunning = false
    }

    start (...args) {
        this.childProcess.send({
            origin: 'debugger',
            name: 'start'
        })

        return super.start(...args)
    }
}
