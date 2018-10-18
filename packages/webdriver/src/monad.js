import { EventEmitter } from 'events'
import logger from 'wdio-logger'

import { commandCallStructure } from './utils'

const SCOPE_TYPES = {
    'browser': function Browser () {},
    'element': function Element () {}
}

export default function WebDriver (options, modifier, propertiesObject = {}) {
    /**
     * In order to allow named scopes for elements we have to propagate that
     * info within the `propertiesObject` object. This doesn't have any functional
     * advantages just provides better description of objects when debugging them
     */
    const scopeType = SCOPE_TYPES[propertiesObject.scope] || SCOPE_TYPES['browser']
    delete propertiesObject.scope

    const prototype = Object.create(scopeType.prototype, {
        isW3C: { value: options.isW3C }
    })
    const log = logger('webdriver')

    const eventHandler = new EventEmitter()
    const EVENTHANDLER_FUNCTIONS = Object.getPrototypeOf(eventHandler)

    /**
     * WebDriver monad
     */
    function unit (sessionId, commandWrapper) {
        propertiesObject.commandList = { value: Object.keys(propertiesObject) }
        propertiesObject.options = { value: options }

        /**
         * allow to wrap commands if necessary
         * e.g. in wdio-cli to make them synchronous
         */
        if (typeof commandWrapper === 'function') {
            for (const [commandName, { value }] of Object.entries(propertiesObject)) {
                if (typeof value !== 'function') {
                    continue
                }

                propertiesObject[commandName].value = commandWrapper(commandName, value)
            }
        }

        let client = Object.create(prototype, propertiesObject)
        client.sessionId = sessionId

        /**
         * register capabilities only to browser scope
         */
        if (scopeType.name === 'Browser') {
            client.capabilities = options.capabilities
        }

        if (typeof modifier === 'function') {
            client = modifier(client, options)
        }

        client.addCommand = function (name, func) {
            unit.lift(name, commandWrapper(name, func))
        }

        return client
    }

    unit.lift = function (name, func) {
        prototype[name] = function next (...args) {
            const client = unit(this.sessionId)
            log.info('COMMAND', commandCallStructure(name, args))

            /**
             * set name of function for better error stack
             */
            Object.defineProperty(func, 'name', {
                value: name,
                writable: false,
            })

            const result = func.apply(client, args)

            /**
             * always transform result into promise as we don't know whether or not
             * the user is running tests with wdio-sync or not
             */
            Promise.resolve(result).then((res) => {
                log.info('RESULT', res)
                this.emit('result', { name, result: res })
            })

            return result
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
