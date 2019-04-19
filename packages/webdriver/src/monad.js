import { EventEmitter } from 'events'
import logger from '@wdio/logger'

import { commandCallStructure } from './utils'

const SCOPE_TYPES = {
    'browser': /* istanbul ignore next */ function Browser () {},
    'element': /* istanbul ignore next */ function Element () {}
}

export default function WebDriver (options, modifier, propertiesObject = {}) {
    /**
     * In order to allow named scopes for elements we have to propagate that
     * info within the `propertiesObject` object. This doesn't have any functional
     * advantages just provides better description of objects when debugging them
     */
    const scopeType = SCOPE_TYPES[propertiesObject.scope] || SCOPE_TYPES['browser']
    delete propertiesObject.scope

    const prototype = Object.create(scopeType.prototype)
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

        /**
         * assign propertiesObject to itself so the client can be recreated
         */
        propertiesObject['__propertiesObject__'] = { value: propertiesObject }

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

        client.addCommand = function (name, func, attachToElement = false, proto, instances) {
            const customCommand = typeof commandWrapper === 'function'
                ? commandWrapper(name, func)
                : func
            if (attachToElement) {
                if (instances) {
                    Object.values(instances).forEach(instance => {
                        instance.__propertiesObject__[name] = {
                            value: customCommand
                        }
                    })
                }
                this.__propertiesObject__[name] = { value: customCommand }
            } else {
                unit.lift(name, customCommand, proto)
            }
        }

        return client
    }

    /**
     * Enhance monad prototype with function
     * @param  {String}   name   name of function to attach to prototype
     * @param  {Function} func   function to be added to prototype
     * @param  {Object}   proto  prototype to add function to (optional)
     */
    unit.lift = function (name, func, proto) {

        (proto || prototype)[name] = function next (...args) {
            log.info('COMMAND', commandCallStructure(name, args))

            /**
             * set name of function for better error stack
             */
            Object.defineProperty(func, 'name', {
                value: name,
                writable: false,
            })

            const result = func.apply(this, args)

            /**
             * always transform result into promise as we don't know whether or not
             * the user is running tests with wdio-sync or not
             */
            Promise.resolve(result).then((res) => {
                log.info('RESULT', res)
                this.emit('result', { name, result: res })
            }).catch(() => {})

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
