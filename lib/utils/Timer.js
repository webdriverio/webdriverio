var q = require('q');

/**
 * Promise-based Timer. Execute fn every tick.
 * When fn is resolved — timer will stop
 * @param {Number} delay - delay between ticks
 * @param {Number} timeout - after that time timer will stop
 * @param {Function} fn - function that returns promise. will execute every tick
 * @param {Boolean} leading - should be function invoked on start
 * @returns {promise}
 * @constructor
 */
function Timer(delay, timeout, fn, leading) {
    this._delay = delay;
    this._timeout = timeout;
    this._fn = fn;
    this._leading = leading;

    this._defer = q.defer();

    this.start();

    return this._defer.promise;

}

Timer.prototype.start = function() {
    this._start = Date.now();
    this._ticks = 0;
    if (this._leading) {
        this.tick();
    } else {
        this._timeoutId = setTimeout(this.tick.bind(this), this._delay);
    }
};

Timer.prototype.stop = function() {
    if (this._timeoutId) {
        clearTimeout(this._timeoutId);
    }
    this._timeoutId = null;
};

Timer.prototype.tick = function() {
    this._time = Date.now() - this._start;
    this._onTick();
    this._defer.notify({
        time: this._time,
        ticks: ++this._ticks
    });
};

Timer.prototype._onTick = function() {
    this._fn().then(function(res) {
        // resolve timer only on truthy values
        if (res) {
            this._defer.resolve(res);
            this.stop();
            return;
        }

        // autocorrect timer
        var diff = (Date.now() - this._start) - (this._ticks * this._delay);
        var delay = Math.max(0, this._delay - diff);

        // clear old timeoutID
        this.stop();
        // check if we have time to one more tick
        if (this.hasTime(delay)) {
            this._timeoutId = setTimeout(this.tick.bind(this), delay);
        } else {
            this._defer.reject('timeout');
        }
    }.bind(this)).catch(function(err) {
        this._defer.reject(err);
        this.stop();
    }.bind(this));

};

Timer.prototype.hasTime = function(delay) {
    return (this._time + delay) <= this._timeout;
};

module.exports = Timer;
