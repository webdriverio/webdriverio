import type { Hook } from './hook.js'
import type { Suite } from './suite.js'
import type { Test } from './test.js'

interface ParallelFields {
    contextId?: string
    parentUid?: string | null
}

/**
 * Main class for a runnable class (e.g. test, suite or a hook)
 * mainly used to capture its running duration
 */
export default abstract class RunnableStats {
    start = new Date()
    end?: Date
    _duration = 0

    constructor (public type: string) {}

    /**
     * only set when the payload has them (parallel mode)
     */
    protected keepParallelFields (this: ParallelFields, runner: ParallelFields) {
        if (runner.contextId !== undefined) {
            this.contextId = runner.contextId
        }
        if (runner.parentUid !== undefined) {
            this.parentUid = runner.parentUid
        }
    }

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
