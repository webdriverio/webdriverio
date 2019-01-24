import { hasWdioSyncSupport, runFnInFiberContext } from '@wdio/config'

const TIMEOUT_ERROR = 'timeout'

/**
 * Promise-based Timer. Execute fn every tick.
 * When fn is resolved — timer will stop
 * @param {Number} delay - delay between ticks
 * @param {Number} timeout - after that time timer will stop
 * @param {Function} fn - function that returns promise. will execute every tick
 * @param {Boolean} leading - should be function invoked on start
 * @return {promise} Promise-based Timer.
 */
class Timer {
    constructor (delay, timeout, fn, leading) {
        this._delay = delay
        this._timeout = timeout
        this._fn = fn
        this._leading = leading
        this._conditionExecutedCnt = 0

        /**
         * only wrap waitUntil condition if:
         *  - wdio-sync is installed
         *  - function name is not async
         */
        if (hasWdioSyncSupport && !fn.name.includes('async')) {
            this._fn = () => runFnInFiberContext(fn)()
        }

        const retPromise = new Promise((resolve, reject) => {
            this._resolve = resolve
            this._reject = reject
        })

        this.start()

        return retPromise
    }

    start () {
        this._start = Date.now()
        this._ticks = 0
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

            const reason = this.lastError || new Error(TIMEOUT_ERROR)
            this._reject(reason)
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
        clearTimeout(this._mainTimeoutId)
    }

    tick () {
        const result = this._fn()

        if (typeof result.then !== 'function') {
            if (!result) {
                return this.checkCondition(new Error('return value was never truthy'))
            }

            return this.checkCondition(null, result)
        }

        result.then(
            (res) => this.checkCondition(null, res),
            (err) => this.checkCondition(err)
        )
    }

    checkCondition (err, res) {
        ++this._conditionExecutedCnt
        this.lastError = err

        // resolve timer only on truthy values
        if (res) {
            this._resolve(res)
            this.stop()
            this.stopMain()
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
            this._reject(reason)
        }
    }

    hasTime (delay) {
        return (Date.now() - this._start + delay) <= this._timeout
    }

    wasConditionExecuted () {
        return this._conditionExecutedCnt > 0
    }
}

export default Timer
