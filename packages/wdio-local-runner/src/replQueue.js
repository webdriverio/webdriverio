import WDIORepl from './repl'

/**
 * repl queue class
 * allows to run debug commands in mutliple workers one after another
 */
export default class ReplQueue {
    constructor () {
        this.runningRepl = null
        this.repls = []
    }

    add (childProcess, options, onStart, onEnd) {
        this.repls.push({ childProcess, options, onStart, onEnd })
    }

    next () {
        if (this.isRunning || this.repls.length === 0) {
            return
        }

        const { childProcess, options, onStart, onEnd } = this.repls.shift()
        this.runningRepl = new WDIORepl(childProcess, options)

        onStart()
        this.runningRepl.start().then(() => {
            const ev = {
                origin: 'debugger',
                name: 'stop'
            }
            this.runningRepl.childProcess.send(ev)
            onEnd(ev)

            delete this.runningRepl
            this.next()
        })
    }

    get isRunning () {
        return Boolean(this.runningRepl)
    }
}
