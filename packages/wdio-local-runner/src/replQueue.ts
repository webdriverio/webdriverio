import type { ChildProcess } from 'child_process'

import WDIORepl from './repl'

interface Repl {
    childProcess: ChildProcess
    options: any
    onStart: Function
    onEnd: Function
}

/**
 * repl queue class
 * allows to run debug commands in mutliple workers one after another
 */
export default class ReplQueue {
    repls: Repl[]
    runningRepl?: WDIORepl

    constructor () {
        this.repls = []
    }

    add (childProcess: ChildProcess, options: any, onStart: Function, onEnd: Function) {
        this.repls.push({ childProcess, options, onStart, onEnd })
    }

    next () {
        if (this.isRunning || this.repls.length === 0) {
            return
        }

        const { childProcess, options, onStart, onEnd } = this.repls.shift() || ({} as Repl)
        const runningRepl = this.runningRepl = new WDIORepl(childProcess, options)

        onStart()
        runningRepl.start().then(() => {
            const ev = {
                origin: 'debugger',
                name: 'stop'
            }
            runningRepl.childProcess.send(ev)
            onEnd(ev)

            delete this.runningRepl
            this.next()
        })
    }

    get isRunning () {
        return Boolean(this.runningRepl)
    }
}
