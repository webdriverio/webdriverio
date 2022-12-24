import type { Hook } from './hook.js'
import type { Suite } from './suite.js'
import type { Test } from './test.js'

/**
 * Main class for a runnable class (e.g. test, suite or a hook)
 * mainly used to capture its running duration
 */
export default abstract class RunnableStats {
    start = new Date()
    end?: Date
    _duration = 0

    constructor (public type: string) {}

    complete () {
        this.end = new Date()
        this._duration = this.end.getTime() - this.start.getTime()
    }

    get duration () {
        if (this.end) {
            return this._duration
        }
        return new Date().getTime() - this.start.getTime()
    }

    /**
     * ToDo: we should always rely on uid
     */
    static getIdentifier (runner: Hook | Suite | Test) {
        return runner.uid || runner.title
    }
}
