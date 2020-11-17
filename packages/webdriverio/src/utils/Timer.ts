import { hasWdioSyncSupport, runFnInFiberContext } from '@wdio/utils'

const TIMEOUT_ERROR = 'timeout'

class Timer {
    private _delay: number;
    private _timeout: number;
    private _fn: () => Promise<boolean> | boolean;
    private _leading: boolean;
    private _conditionExecutedCnt: number;
    private _start?: number;
    private _ticks?: number;
    private _timeoutId?: NodeJS.Timeout | null;
    private _mainTimeoutId?: NodeJS.Timeout | null;
    private lastError?: Error;
    private _resolve?: (value?: PromiseLike<Timer>) => void;
    private _reject?: (reason?: Error) => void;

    constructor (delay: number, timeout: number, fn: () => Promise<boolean> | boolean, leading: boolean) {
        this._delay = delay
        this._timeout = timeout
        this._fn = fn
        this._leading = leading
        this._conditionExecutedCnt = 0

        /**
         * only wrap waitUntil condition if:
         *  - wdio-sync is installed
         *  - function name is not async
         *  - we run with the wdio testrunner
         */
        if (hasWdioSyncSupport && !fn.name.includes('async') && Boolean(global.browser)) {
            this._fn = () => runFnInFiberContext(fn)()
        }

        const retPromise = new Promise<Timer>((resolve, reject) => {
            this._resolve = resolve
            this._reject = reject
        })

        this.start()

        return retPromise as any
    }

    start () {
        this._start = Date.now()
        this._ticks = 0
        emitTimerEvent({ id: this._start, start: true })
        if (this._leading) {
            this.tick()
        } else {
            this._timeoutId = setTimeout(this.tick.bind(this), this._delay)
        }

        this._mainTimeoutId = setTimeout(() => {
            /**
             * make sure that condition was executed at least once
             */
            if (!this.wasConditionExecuted()) {
                return
            }

            emitTimerEvent({ id: this._start, timeout: true })
            const reason = this.lastError || new Error(TIMEOUT_ERROR)
            if (this._reject) {
                this._reject(reason)
            }
            this.stop()
        }, this._timeout)
    }

    stop () {
        if (this._timeoutId) {
            clearTimeout(this._timeoutId)
        }
        this._timeoutId = null
    }

    stopMain () {
        emitTimerEvent({ id: this._start })
        if (this._mainTimeoutId) {
            clearTimeout(this._mainTimeoutId)
        }
    }

    tick () {
        const result = this._fn() as any

        if (typeof result.then !== 'function') {
            if (!result) {
                return this.checkCondition(new Error('return value was never truthy'))
            }

            return this.checkCondition(null, result)
        }

        result.then(
            (res: any) => this.checkCondition(null, res),
            (err: any) => this.checkCondition(err)
        )
    }

    checkCondition (err: Error | null, res?: any) {
        ++this._conditionExecutedCnt
        this.lastError = err

        // resolve timer only on truthy values
        if (res && this._resolve) {
            this._resolve(res)
            this.stop()
            this.stopMain()
            return
        }

        if (this._start === undefined || this._ticks === undefined) {
            return
        }

        // autocorrect timer
        let diff = (Date.now() - this._start) - (this._ticks++ * this._delay)
        let delay = Math.max(0, this._delay - diff)

        // clear old timeoutID
        this.stop()

        // check if we have time to one more tick
        if (this.hasTime(delay)) {
            this._timeoutId = setTimeout(this.tick.bind(this), delay)
        } else {
            this.stopMain()
            const reason = this.lastError || new Error(TIMEOUT_ERROR)
            if (this._reject) {
                this._reject(reason)
            }
        }
    }

    hasTime (delay: number) {
        return this._start && (Date.now() - this._start + delay) <= this._timeout
    }

    wasConditionExecuted () {
        return this._conditionExecutedCnt && this._conditionExecutedCnt > 0
    }
}

function emitTimerEvent(payload: object) {
    if (hasWdioSyncSupport) {
        process.emit('WDIO_TIMER' as any, payload as any)
    }
}

export default Timer
