'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _q = require('q');

var _q2 = _interopRequireDefault(_q);

/**
 * Multibrowser
 */

var Multibrowser = (function () {
    function Multibrowser() {
        _classCallCheck(this, Multibrowser);

        this.instances = {};
        this.promiseBucket = [];

        var defer = _q2['default'].defer();
        this.qResolve = defer.resolve.toString();
    }

    /**
     * add instance to multibrowser instance
     */

    _createClass(Multibrowser, [{
        key: 'addInstance',
        value: function addInstance(browserName, client) {
            if (this.instances[browserName]) {
                throw new Error('webdriver instance "' + browserName + '" is already defined');
            }
            this.instances[browserName] = client;
        }

        /**
         * modifier for multibrowser instance
         */
    }, {
        key: 'getModifier',
        value: function getModifier() {
            return multiremoteModifier.bind(this);
        }

        /**
         * flush bucket and return current pending promises
         */
    }, {
        key: 'flushPromiseBucket',
        value: function flushPromiseBucket() {
            var bucket = this.promiseBucket.filter(function (promise) {
                return promise.inspect().state === 'pending';
            });
            this.promiseBucket = [];
            return bucket;
        }

        /**
         * modifier for single webdriverio instances
         */
    }, {
        key: 'getInstanceModifier',
        value: function getInstanceModifier() {
            return instanceModifier.bind(this);
        }
    }]);

    return Multibrowser;
})();

function instanceModifier(client) {
    var _next = client.next;
    var multibrowser = this;

    /**
     * Overwrite next (bind) method to put each command into a bucket.
     * This provides us useful information about all current running
     * commands.
     */
    client.next = function () {
        multibrowser.promiseBucket.push(this.promise);
        return _next.apply(this, arguments);
    };

    return client;
}

function multiremoteModifier(client) {
    var multibrowser = this;
    var browserNames = _Object$keys(multibrowser.instances);

    client.getInstances = function () {
        return browserNames;
    };

    client.next = function () {
        var _this = this;

        var promises = [];

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var fnName = args.pop();

        /**
         * no need for actual function here
         */
        args.shift();

        /**
         * flush promise bucket
         */
        multibrowser.promiseBucket = [];
        var commandArgs = args.pop();
        return this.lastPromise.done(function () {
            browserNames.forEach(function (browserName) {
                var instance = multibrowser.instances[browserName];
                promises.push(instance[fnName].apply(instance, commandArgs).promise);
            });

            return _Promise.all(promises).then(function (result) {
                /**
                 * custom event handling since multibrowser instance
                 * actually never executes any command
                 */
                var payload = {
                    fnName: fnName
                };

                for (var i = 0; i < browserNames.length; ++i) {
                    payload[browserNames[i]] = result[i];
                }

                if (fnName.match(/(init|end)/)) {
                    _this.emit(fnName, payload);
                }

                _this.emit('result', payload);
                _this.defer.resolve(result);
            }, function (err) {
                _this.emit('error', err);
                _this.defer.reject(err);
            });
        });
    };

    var _then = client.then;
    client.then = function (onFulfilled, onRejected) {
        /**
         * curry arguments
         * as multibrowser commands return with an array of results for each instance
         * respectively (see q.all) we need to curry them (expand arguments) to help
         * users to better work with the results
         *
         * uncurried original version:
         * ```js
         * matrix.getTitle().then(function (result) {
         *     expect(result[0]).to.be.equal('title of browser A')
         *     expect(result[1]).to.be.equal('title of browser B')
         * })
         * ```
         *
         * curried version:
         * ```js
         * matrix.getTitle().then(function (result) {
         *     expect(result.browserA).to.be.equal('title of browser A')
         *     expect(result.browserB).to.be.equal('title of browser B')
         * })
         * ```
         */
        var curryArguments = function curryArguments(args) {
            /**
             * when returning with a promise within a multibrowser promise like
             *
             * ```js
             * matrix.url(...).getTitle().then(function () {
             *     return matrix.getSource()
             * })
             * ```
             *
             * we will have problems as we are running through curryArguments twice.
             * Therefor check if the onFulFilled handler is from the Q library and
             * handle that promise as usual here.
             * It's an ugly hack but the only way to get around with this and having
             * nice curried arguments.
             *
             */
            if (onFulfilled.toString() === multibrowser.qResolve) {
                return onFulfilled.apply(this, arguments);
            }
            if (arguments.length === 1 && !Array.isArray(args)) {
                return onFulfilled.call(this, args);
            }

            if (arguments.length > 1) {
                args = Array.prototype.slice.call(arguments);
            }

            var result = {};
            for (var i = 0; i < browserNames.length; ++i) {
                result[browserNames[i]] = args[i];
            }
            return onFulfilled.call(this, result);
        };

        if (!onFulfilled && !onRejected) {
            return this;
        }

        if (onFulfilled && !onRejected) {
            return _then.call(this, curryArguments);
        }

        if (onFulfilled && onRejected) {
            return _then.call(this, curryArguments, onRejected);
        }

        return _then.call(this, undefined, onRejected);
    };

    client.select = function (browserName) {
        var instance = multibrowser.instances[browserName];

        if (!instance) {
            throw new Error('browser name "' + browserName + '" was not defined');
        }

        instance.isMultibrowser = false;
        return instance;
    };

    client.sync = function () {
        var bucket = multibrowser.flushPromiseBucket();
        return this.call(function () {
            return _Promise.all(bucket);
        });
    };

    var _addCommand = client.addCommand;
    client.addCommand = function (fnName, fn, forceOverwrite) {
        var _this2 = this;

        var args = arguments;
        _addCommand.apply(this, args);
        _Object$keys(multibrowser.instances).forEach(function (browserName) {
            var instance = multibrowser.instances[browserName];
            instance.addCommand.apply(_this2, args);
        });
        return this;
    };

    return client;
}

exports['default'] = Multibrowser;
module.exports = exports['default'];
