'use strict'

import q from 'q'
import fs from 'fs'
import path from 'path'
import merge from 'deepmerge'
import mkdirp from 'mkdirp'
import events from 'events'

import RequestHandler from './utils/RequestHandler'
import { RuntimeError } from './utils/ErrorHandler'
import Logger from './utils/Logger'

import safeExecute from './helpers/safeExecute'
import sanitize from './helpers/sanitize'
import mobileDetector from './helpers/mobileDetector'
import detectSeleniumBackend from './helpers/detectSeleniumBackend'
import internalErrorHandler from './helpers/errorHandler'
import hasElementResult from './helpers/hasElementResultHelper'

const INTERNAL_EVENTS = ['init', 'command', 'error', 'result', 'end']
const PROMISE_FUNCTIONS = ['then', 'catch', 'finally']

let EventEmitter = events.EventEmitter

/**
 * WebdriverIO v4
 */
let WebdriverIO = function (args, modifier) {
    let prototype = Object.create(Object.prototype)
    let eventHandler = new EventEmitter()
    let fulFilledPromise = q()
    let stacktrace = []
    let commandList = []

    const EVENTHANDLER_FUNCTIONS = Object.getPrototypeOf(eventHandler)

    /**
     * merge default options with given user options
     */
    let options = merge({
        protocol: 'http',
        waitforTimeout: 500,
        waitforInterval: 250,
        coloredLogs: true,
        logLevel: 'silent',
        baseUrl: null,
        onError: [],
        connectionRetryTimeout: 90000,
        connectionRetryCount: 3
    }, typeof args !== 'string' ? args : {})

    /**
     * define Selenium backend given on user options
     */
    options = merge(detectSeleniumBackend(args), options)

    /**
     * only set globals we wouldn't get otherwise
     */
    if (!process.env.WEBDRIVERIO_COLORED_LOGS) {
        process.env.WEBDRIVERIO_COLORED_LOGS = options.coloredLogs
    }

    let logger = new Logger(options, eventHandler)
    let requestHandler = new RequestHandler(options, eventHandler, logger)

    /**
     * assign instance to existing session
     */
    if (typeof args === 'string') {
        requestHandler.sessionID = args
    }

    /**
     * sanitize error handler
     */
    if (!Array.isArray(options.onError)) {
        options.onError = [options.onError]
    }
    options.onError = options.onError.filter((fn) => {
        return typeof fn === 'function'
    })

    let desiredCapabilities = merge({
        javascriptEnabled: true,
        locationContextEnabled: true,
        handlesAlerts: true,
        rotatable: true
    }, options.desiredCapabilities || {})

    let { isMobile, isIOS, isAndroid } = mobileDetector(desiredCapabilities)

    /**
     * if no caps are specified fall back to firefox
     */
    if (!desiredCapabilities.browserName && !isMobile) {
        desiredCapabilities.browserName = 'firefox'
    }

    if (!isMobile && typeof desiredCapabilities.loggingPrefs === 'undefined') {
        desiredCapabilities.loggingPrefs = {
            browser: 'ALL',
            driver: 'ALL'
        }
    }

    let resolve = function (result, onFulfilled, onRejected, context) {
        if (typeof result === 'function') {
            this.isExecuted = true
            result = result.call(this)
        }

        /**
         * run error handler if command fails
         */
        if (result instanceof Error) {
            let _result = result

            this.defer.resolve(Promise.all(internalErrorHandler.map((fn) => {
                return fn.call(context, result)
            })).then((res) => {
                const handlerResponses = res.filter((r) => typeof r !== 'undefined')

                /**
                 * if no handler was triggered trough actual error
                 */
                if (handlerResponses.length === 0) {
                    return callErrorHandlerAndReject.call(context, _result, onRejected)
                }

                return onFulfilled.call(context, handlerResponses[0])
            }, (e) => {
                return callErrorHandlerAndReject.call(context, e, onRejected)
            }))
        } else {
            this.defer.resolve(result)
        }

        return this.promise
    }

    /**
     * middleware to call on error handler in wdio mode
     */
    let callErrorHandlerAndReject = function (err, onRejected) {
        /**
         * only call error handler if there is any and if error has bubbled up
         */
        if (!this || this.depth !== 0 || options.onError.length === 0) {
            return reject.call(this, err, onRejected)
        }

        return new Promise((resolve, reject) => {
            return Promise.all(options.onError.map((fn) => {
                if (!global.wdioSync) {
                    return fn.call(this, err)
                }

                return new Promise((r) => global.wdioSync(fn, r).call(this, err))
            })).then(resolve, reject)
        }).then(() => {
            return reject.call(this, err, onRejected)
        })
    }

    /**
     * By using finally in our next method we omit the duty to throw an exception at some
     * point. To avoid propagating rejected promises until everything crashes silently we
     * check if the last and current promise got rejected. If so we can throw the error.
     */
    let reject = function (err, onRejected) {
        if (!options.isWDIO && typeof onRejected === 'function') {
            delete err.screenshot
            return onRejected(err)
        } else if (typeof onRejected === 'function') {
            onRejected(err)
        }

        if (!this) {
            throw err
        } else if (this.depth !== 0) {
            return this.promise
        }

        /**
         * take screenshot only if screenshotPath is given
         */
        if (typeof options.screenshotPath !== 'string' || err.shotTaken) {
            return throwException(err, stacktrace)
        }

        let screenshotPath = path.isAbsolute(options.screenshotPath)
            ? options.screenshotPath : path.join(process.cwd(), options.screenshotPath)

        /**
        * create directory if not existing
        */
        try {
            fs.statSync(screenshotPath)
        } catch (e) {
            mkdirp.sync(screenshotPath)
        }

        let client = unit()
        let capId = sanitize.caps(desiredCapabilities)
        let timestamp = new Date().toJSON().replace(/:/g, '-')
        let filename = `ERROR_${capId}_${timestamp}.png`
        let filePath = path.join(screenshotPath, filename)
        let screenshotPromise = Promise.resolve()

        /**
         * don't take a new screenshot if we already got one from Selenium
         */
        if (typeof err.screenshot === 'string') {
            let screenshot = new Buffer(err.screenshot, 'base64')
            fs.writeFileSync(filePath, screenshot)
            client.emit('screenshot', { data: err.screenshot, filename })
        } else {
            screenshotPromise = client.next(prototype.saveScreenshot, [filePath], 'saveScreenshot')
        }
        client.logger.log(`\tSaved screenshot: ${filename}`)

        err.shotTaken = true
        return screenshotPromise.then(() => {
            let stack = stacktrace.slice()
            return throwException(err, stack)
        })
    }

    function throwException (e, stack) {
        if (!e.stack) {
            throw new Error(e)
        }

        stack = stack.map(trace => '    at ' + trace)
        e.stack = e.type + ': ' + e.message + '\n' + stack.reverse().join('\n')

        /**
         * ToDo useful feature for standalone mode:
         * option that if true causes script to throw exception if command fails:
         *
         * process.nextTick(() => {
         *     throw e
         * })
         */

        throw e
    }

    /**
     * WebdriverIO Monad
     */
    function unit (lastPromise) {
        let client = Object.create(prototype)
        let defer = q.defer()
        let promise = defer.promise

        client.defer = defer
        client.promise = promise
        client.lastPromise = lastPromise || fulFilledPromise

        client.desiredCapabilities = desiredCapabilities
        client.requestHandler = requestHandler
        client.logger = logger
        client.options = options
        client.commandList = commandList

        client.isMobile = isMobile
        client.isIOS = isIOS
        client.isAndroid = isAndroid

        /**
         * actual bind function
         */
        client.next = function (func, args, name) {
            /**
             * use finally to propagate rejected promises up the chain
             */
            return this.lastPromise.then((val) => {
                /**
                 * store command into command list so `getHistory` can return it
                 */
                commandList.push({name, args})

                /**
                 * allow user to leave out selector argument if they have already queried an element before
                 */
                let lastResult = val || this.lastResult
                if (hasElementResult(lastResult) && args.length < func.length && func.toString().indexOf(`function ${name}(selector`) === 0) {
                    if (lastResult.selector && name === 'waitForExist') {
                        this.lastResult = null
                        args.unshift(lastResult.selector)
                    } else {
                        args.unshift(null)
                    }
                }

                return resolve.call(this, safeExecute(func, args))
            }, (e) => {
                /**
                 * this will get reached only in standalone mode if the command
                 * fails and doesn't get followed by a then or catch method
                 */
                return resolve.call(this, e, null, null, { depth: 0 })
            })
        }

        client.finally = function (fn) {
            let client = unit(this.promise.finally(() => {
                return resolve.call(client, safeExecute(fn, []).bind(this))
            }))
            return client
        }

        client.call = function (fn) {
            let client = unit(this.promise.done(() => {
                return resolve.call(client, safeExecute(fn, []).bind(this))
            }))
            return client
        }

        client.then = function (onFulfilled, onRejected) {
            if (typeof onFulfilled !== 'function' && typeof onRejected !== 'function') {
                return this
            }

            /**
             * execute then function in context of the new instance
             * but resolve result with this
             */
            let client = unit(this.promise.then((...args) => {
                /**
                 * store result in commandList
                 */
                if (commandList.length) {
                    commandList[commandList.length - 1].result = args[0]
                }

                /**
                 * resolve command
                 */
                return resolve.call(client, safeExecute(onFulfilled, args).bind(this))
            }, (e) => {
                let result = safeExecute(onRejected, [e]).bind(this)

                /**
                 * handle error once command was bubbled up the command chain
                 */
                if (this.depth === 0) {
                    result = e
                }

                return resolve.call(client,
                    result,
                    onFulfilled,
                    onRejected,
                    this
                )
            }))

            return client
        }

        client.catch = function (onRejected) {
            return this.then(undefined, onRejected)
        }

        client.inspect = function () {
            return this.promise.inspect()
        }

        /**
         * internal helper method to handle command results
         *
         * @param  {Promise[]} promises  list of promises
         * @param  {Boolean}   option    if true extract value property from selenium result
         */
        client.unify = function (promises, option) {
            option = option || {}
            promises = Array.isArray(promises) ? promises : [promises]

            return Promise.all(promises)
                /**
                 * extract value property from result if desired
                 */
                .then((result) => {
                    if (!option.extractValue || !Array.isArray(result)) {
                        return result
                    }

                    return result.map(res =>
                        res.value && typeof res.value === 'string' ? res.value.trim() : res.value)

                /**
                 * sanitize result for better assertion
                 */
                }).then((result) => {
                    if (Array.isArray(result) && result.length === 1) {
                        result = result[0]
                    }

                    if (option.lowercase && typeof result === 'string') {
                        result = result.toLowerCase()
                    }

                    return result
                })
        }

        client.addCommand = function (fnName, fn, forceOverwrite) {
            if (typeof fn === 'string') {
                const namespace = arguments[0]
                fnName = arguments[1]
                fn = arguments[2]
                forceOverwrite = arguments[3]

                switch (typeof client[namespace]) {
                case 'function':
                    throw new RuntimeError(`Command namespace "${namespace}" is used internally, and can't be overwritten!`)
                case 'object':
                    if (client[namespace][fnName] && !forceOverwrite) {
                        throw new RuntimeError(`Command "${fnName}" is already defined!`)
                    }
                    break
                }
                return unit.lift(namespace, fnName, fn)
            }

            if (client[fnName] && !forceOverwrite) {
                throw new RuntimeError(`Command "${fnName}" is already defined!`)
            }
            return unit.lift(fnName, fn)
        }

        client.getPrototype = function () {
            return prototype
        }

        client.transferPromiseness = function (target, promise) {
            /**
             * transfer WebdriverIO commands
             */
            let clientFunctions = Object.keys(prototype)
            let functionsToTranfer = clientFunctions.concat(PROMISE_FUNCTIONS)

            for (let fnName of functionsToTranfer) {
                if (typeof promise[fnName] === 'function') {
                    target[fnName] = promise[fnName].bind(promise)
                }
            }
        }

        if (typeof modifier === 'function') {
            client = modifier(client, options)
        }

        return client
    }

    /**
     * enhance base monad prototype with methods
     */
    unit.lift = function (name, func) {
        let commandGroup = prototype

        if (typeof func === 'string') {
            const namespace = arguments[0]
            name = arguments[1]
            func = arguments[2]

            if (!prototype[namespace]) {
                prototype[namespace] = {}
            }

            commandGroup = prototype[namespace]
        }

        commandGroup[name] = function (...args) {
            let nextPromise = this.promise

            /**
             * commands executed inside commands don't have to wait
             * on any promise
             */
            if (this.isExecuted) {
                nextPromise = this.lastPromise
            }

            let client = unit(nextPromise)

            /**
             * catch stack to find information about where the command that causes
             * the error was used (stack line 2) and only save it when it was not
             * within WebdriverIO context
             */
            let stack = new Error().stack
            let lineInTest = stack.split('\n').slice(2, 3).join('\n')
            let fileAndPosition = lineInTest.slice(lineInTest.indexOf('(') + 1, lineInTest.indexOf(')'))
            let atCommand = lineInTest.trim().slice(3).split(' ')[0]

            atCommand = atCommand.slice(atCommand.lastIndexOf('.') + 1)

            let trace = name + '(' + sanitize.args(args) + ') - ' + fileAndPosition.slice(fileAndPosition.lastIndexOf('/') + 1)
            if (Object.keys(prototype).indexOf(atCommand) === -1 && atCommand !== 'exports') {
                stacktrace = [trace]
            } else {
                /**
                 * save trace for nested commands
                 */
                stacktrace.push(trace)
            }

            /**
             * determine execution depth:
             * This little tweak helps us to determine whether the command was executed
             * by the test script or by another command. With that we can make sure
             * that errors are getting thrown once they bubbled up the command chain.
             */
            client.depth = stack.split('\n').filter((line) => !!line.match(/\/lib\/(commands|protocol)\/(\w+)\.js/)).length

            /**
             * queue command
             */
            client.name = name
            client.lastResult = this.lastResult
            client.next(func, args, name)
            return client
        }

        return unit
    }

    /**
     * register event emitter
     */
    for (let eventCommand in EVENTHANDLER_FUNCTIONS) {
        prototype[eventCommand] = function (...args) {
            /**
             * custom commands needs to get emitted and registered in order
             * to prevent race conditions
             */
            if (INTERNAL_EVENTS.indexOf(args[0]) === -1) {
                return this.finally(() => eventHandler[eventCommand].apply(eventHandler, args))
            }

            eventHandler[eventCommand].apply(eventHandler, args)
            return this
        }
    }

    return unit
}

export default WebdriverIO
