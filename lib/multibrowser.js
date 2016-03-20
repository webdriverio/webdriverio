import q from 'q'

/**
 * Multibrowser
 */
class Multibrowser {
    constructor () {
        this.instances = {}
        this.promiseBucket = []

        var defer = q.defer()
        this.qResolve = defer.resolve.toString()
    }

    /**
     * add instance to multibrowser instance
     */
    addInstance (browserName, client) {
        if (this.instances[browserName]) {
            throw new Error(`webdriver instance "${browserName}" is already defined`)
        }
        this.instances[browserName] = client
    }

    /**
     * modifier for multibrowser instance
     */
    getModifier () {
        return multiremoteModifier.bind(this)
    }

    /**
     * flush bucket and return current pending promises
     */
    flushPromiseBucket () {
        var bucket = this.promiseBucket.filter(promise => promise.inspect().state === 'pending')
        this.promiseBucket = []
        return bucket
    }

    /**
     * modifier for single webdriverio instances
     */
    getInstanceModifier () {
        return instanceModifier.bind(this)
    }
}

function instanceModifier (client) {
    let _next = client.next
    let multibrowser = this

    /**
     * Overwrite next (bind) method to put each command into a bucket.
     * This provides us useful information about all current running
     * commands.
     */
    client.next = function () {
        multibrowser.promiseBucket.push(this.promise)
        return _next.apply(this, arguments)
    }

    return client
}

function multiremoteModifier (client) {
    let multibrowser = this
    let browserNames = Object.keys(multibrowser.instances)

    client.getInstances = function () {
        return browserNames
    }

    client.next = function (...args) {
        let promises = []
        let fnName = args.pop()

        /**
         * no need for actual function here
         */
        args.shift()

        /**
         * flush promise bucket
         */
        multibrowser.promiseBucket = []
        let commandArgs = args.pop()
        return this.lastPromise.done(() => {
            browserNames.forEach((browserName) => {
                let instance = multibrowser.instances[browserName]
                promises.push(instance[fnName].apply(instance, commandArgs).promise)
            })

            return Promise.all(promises).then((result) => {
                /**
                 * custom event handling since multibrowser instance
                 * actually never executes any command
                 */
                let payload = {
                    fnName: fnName
                }

                for (var i = 0; i < browserNames.length; ++i) {
                    payload[browserNames[i]] = result[i]
                }

                if (fnName.match(/(init|end)/)) {
                    this.emit(fnName, payload)
                }

                this.emit('result', payload)
                this.defer.resolve(result)
            }, (err) => {
                this.emit('error', err)
                this.defer.reject(err)
            })
        })
    }

    var _then = client.then
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
        let curryArguments = function (args) {
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
                return onFulfilled.apply(this, arguments)
            }
            if (arguments.length === 1 && !Array.isArray(args)) {
                return onFulfilled.call(this, args)
            }

            if (arguments.length > 1) {
                args = Array.prototype.slice.call(arguments)
            }

            let result = {}
            for (let i = 0; i < browserNames.length; ++i) {
                result[browserNames[i]] = args[i]
            }
            return onFulfilled.call(this, result)
        }

        if (!onFulfilled && !onRejected) {
            return this
        }

        if (onFulfilled && !onRejected) {
            return _then.call(this, curryArguments)
        }

        if (onFulfilled && onRejected) {
            return _then.call(this, curryArguments, onRejected)
        }

        return _then.call(this, undefined, onRejected)
    }

    client.select = function (browserName) {
        var instance = multibrowser.instances[browserName]

        if (!instance) {
            throw new Error(`browser name "${browserName}" was not defined`)
        }

        instance.isMultibrowser = false
        return instance
    }

    client.sync = function () {
        var bucket = multibrowser.flushPromiseBucket()
        return this.call(() => Promise.all(bucket))
    }

    var _addCommand = client.addCommand
    client.addCommand = function (fnName, fn, forceOverwrite) {
        const args = arguments
        _addCommand.apply(this, args)
        Object.keys(multibrowser.instances).forEach((browserName) => {
            let instance = multibrowser.instances[browserName]
            instance.addCommand.apply(this, args)
        })
        return this
    }

    return client
}

export default Multibrowser
