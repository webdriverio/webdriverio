/**
 * Main class for a runnable class (e.g. test, suite or a hook)
 * mainly used to capture its running duration
 */

export interface Runnable {
    uid?: string
    title: string
}

export interface RunnableError {
    message: string
    stack: string
    type: string
}

export default abstract class RunnableStats {
    type: string
    start: number
    end?: number
    private _duration: number

    constructor (type: string) {
        this.type = type
        this.start = Date.now()
        this._duration = 0
    }

    complete () {
        this.end = Date.now()
        this._duration = this.end - this.start
    }

    get duration () {
        if (this.end) {
            return this._duration
        }
        return Date.now() - this.start
    }

    /**
     * ToDo: we should always rely on uid
     */
    static getIdentifier (runner: Runnable) {
        return runner.uid || runner.title
    }
}
