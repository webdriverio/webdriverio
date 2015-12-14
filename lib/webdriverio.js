'use strict'

import q from 'q'
import fs from 'fs'
import path from 'path'
import merge from 'deepmerge'
import events from 'events'

import RequestHandler from './utils/RequestHandler'
import { RuntimeError } from './utils/ErrorHandler'
import Logger from './utils/Logger'

import safeExecute from './helpers/safeExecute'
import sanitize from './helpers/sanitize'
import mobileDetector from './helpers/mobileDetector'
import detectSeleniumBackend from './helpers/detectSeleniumBackend'
import errorHandler from './helpers/errorHandler'

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
        coloredLogs: true,
        logLevel: 'silent',
        baseUrl: null,
        onError: []
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
     * apply error handler
     */
    if (!Array.isArray(options.onError)) {
        options.onError = [options.onError]
    }
    options.onError = options.onError.filter((fn) => {
        return typeof fn === 'function'
    })

    /**
     * add default error handler
     */
    options.onError = options.onError.concat(errorHandler)

    let desiredCapabilities = merge({
        browserName: 'firefox',
        version: '',
        javascriptEnabled: true,
        locationContextEnabled: true,
        handlesAlerts: true,
        rotatable: true,
        platform: 'ANY'
    }, options.desiredCapabilities || {})

    let { isMobile, isIOS, isAndroid } = mobileDetector(desiredCapabilities)

    let resolve = function (result, isErrorHandled, onFulfilled, context) {
        if (typeof result === 'function') {
            this.isExecuted = true
            result = result.call(this)
        }

        /**
         * run error handler if command fails
         */
        if (result instanceof Error) {
            let _result = result

            result = safeExecute(function () {
                return Promise.all(options.onError.map((fn) => {
                    return fn.call(this, result)
                })).then((res) => {
                    const handlerResponses = res.filter((r) => !!r)

                    /**
                     * if no handler was triggered trough actual error
                     */
                    if (handlerResponses.length === 0) {
                        return reject.call(this, _result, isErrorHandled)
                    }

                    return onFulfilled.call(this, handlerResponses[0])
                }, (e) => {
                    return reject.call(this, e, isErrorHandled)
                })
            }, []).bind(context)()
        }

        this.defer.resolve(result)
        return this.promise
    }

    /**
     * By using finally in our next method we omit the duty to throw an exception at some
     * point. To avoid propagating rejected promises until everything crashes silently we
     * check if the last and current promise got rejected. If so we can throw the error.
     */
    let reject = function (err, isErrorHandled) {
        if (isErrorHandled) {
            return this.promise
        }

        /**
         * take screenshot only if screenshotPath is given
         */
        if (typeof options.screenshotPath !== 'string') {
            return throwException(err, stacktrace)
        }

        let screenshotPath = path.join(process.cwd(), options.screenshotPath)

        /**
         * take screenshot only if directory exists
         */
        if (!fs.existsSync(screenshotPath)) {
            return throwException(err, stacktrace)
        }

        let client = unit()
        client.next(prototype.saveScreenshot, [
            path.join(screenshotPath, 'ERROR_' + sanitize.caps(desiredCapabilities) + '_' + new Date().toJSON() + '.png')
        ], 'saveScreenshot')

        let stack = stacktrace.slice()
        return throwException.bind(null, err, stack)
    }

    function throwException (e, stack) {
        if (!e.stack) {
            throw new Error(e)
        }

        stack = stack.map(trace => '    at ' + trace)
        e.stack = e.type + ': ' + e.message + '\n' + stack.reverse().join('\n')

        eventHandler.emit('error', e)
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
            return this.lastPromise.then(() => {
                /**
                 * store command into command list so `getHistory` can return it
                 */
                commandList.push({name, args})

                return resolve.call(this, safeExecute(func, args))
            }, (e) => {
                /**
                 * reject pending commands in chain
                 */
                if (e.isPropagatedError) {
                    return this.defer.reject(e)
                }

                /**
                 * mark error as propagated so that error messages get only printed once
                 */
                e.isPropagatedError = true
                logger.printException(e.type || 'Error', e.message, stacktrace)
                this.defer.reject(e)
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
                commandList[commandList.length - 1].result = args[0]

                /**
                 * resolve command
                 */
                return resolve.call(client, safeExecute(onFulfilled, args).bind(this))
            }, (...args) => {
                return resolve.call(client,
                    safeExecute(onRejected, args).bind(this),
                    typeof onRejected === 'function',
                    onFulfilled,
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

            return q.all(promises)
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
             * queue command
             */
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
