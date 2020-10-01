/**
 * Main class for a runnable class (e.g. test, suite or a hook)
 * mainly used to capture its running duration
 */

type ErrorType = 'AssertionError' | 'Error';

export interface Runnable {
    uid: string;
    title: string;
}

export interface Error {
    message: string;
    stack: string;
    type: ErrorType;
    expected: any;
    actual: any;
}

export default class RunnableStats {
    private _type: any
    private _start: number
    private _duration: number
    private _end!: number
    constructor(type: any) {
        this._type = type
        this._start = new Date().valueOf()
        this._duration = 0
    }

    complete() {
        this._end = new Date().valueOf();
        this._duration = this._end - this._start
    }

    get duration() {
        if (this._end) {
            return this._duration
        }
        return new Date().valueOf() - this._start
    }

    /**
     * ToDo: we should always rely on uid
     */
    static getIdentifier(runner: { uid?: any; title: any }) {
        return runner.uid || runner.title
    }
}
