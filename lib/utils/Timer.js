
/**
 * Promise-based Timer. Execute fn every tick.
 * When fn is resolved — timer will stop
 * @param {Number} delay - delay between ticks
 * @param {Number} timeout - after that time timer will stop
 * @param {Function} fn - function that returns promise. will execute every tick
 * @param {Boolean} leading - should be function invoked on start
 * @returns {promise}
 */
class Timer {
    constructor (delay, timeout, fn, leading) {
        this._delay = delay
        this._timeout = timeout
        this._fn = fn
        this._leading = leading

        this.start()

        return new Promise((resolve, reject) => {
            this._resolve = resolve
            this._reject = reject
        })
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
            this._reject('timeout')
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
        this._fn().then((res) => {
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
                this._reject('timeout')
            }
        }).catch((err) => {
            this.stop()
            this.stopMain()
            this._reject(err)
        })
    }

    hasTime (delay) {
        return (Date.now() - this._start + delay) <= this._timeout
    }
}

export default Timer
