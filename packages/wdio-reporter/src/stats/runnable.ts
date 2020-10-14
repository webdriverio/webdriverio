/**
 * Main class for a runnable class (e.g. test, suite or a hook)
 * mainly used to capture its running duration
 */
export interface RunnableError {
    message: string
    stack: string
    type: string
    expected?: any
    actual?: any
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
    static getIdentifier (runner: {uid?:string, title: string}) {
        return runner.uid || runner.title
    }
}
