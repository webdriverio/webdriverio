import WDIORepl from '@wdio/repl'

export default class WDIORunnerRepl extends WDIORepl {
    constructor (childProcess, options) {
        super(options)
        this.childProcess = childProcess
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
        // Send to parent process a debugger event with name of eval. 
        // only fired when the webdriverio repl is running.
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
