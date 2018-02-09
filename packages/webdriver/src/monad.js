import { EventEmitter } from 'events'
import logger from 'wdio-logger'

export default function WebDriver (options, modifier) {
    const prototype = Object.create(Object.prototype)
    const log = logger('webdriver')

    const eventHandler = new EventEmitter()
    const EVENTHANDLER_FUNCTIONS = Object.getPrototypeOf(eventHandler)

    /**
     * WebDriver monad
     */
    function unit (sessionId) {
        let client = Object.create(prototype)
        client.options = options
        client.sessionId = sessionId

        if (typeof modifier === 'function') {
            client = modifier(client, options)
        }

        client.addCommand = function (name, func) {
            unit.lift(name, func)
        }

        return client
    }

    unit.lift = function (name, func) {
        prototype[name] = function next (...args) {
            const client = unit(this.sessionId)
            log.info('COMMAND', `${name}(${args.join(', ')})`)

            /**
             * set name of function for better error stack
             */
            Object.defineProperty(func, 'name', { writable: true })
            func.name = name

            return func.apply(client, args)
        }
    }

    /**
     * register event emitter
     */
    for (let eventCommand in EVENTHANDLER_FUNCTIONS) {
        prototype[eventCommand] = function (...args) {
            eventHandler[eventCommand](...args)
            return this
        }
    }

    return unit
}
