import { EventEmitter } from 'events'
import logger from '@wdio/logger'

import { commandCallStructure, overwriteElementCommands } from './utils'

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
        /**
         * capabilities attached to the instance prototype not being shown if
         * logging the instance
         */
        propertiesObject.commandList = { value: Object.keys(propertiesObject) }
        propertiesObject.options = { value: options }
        propertiesObject.requestedCapabilities = { value: options.requestedCapabilities }

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
                propertiesObject[commandName].configurable = true
            }
        }

        /**
         * overwrite native element commands with user defined
         */
        overwriteElementCommands.call(this, propertiesObject)

        /**
         * assign propertiesObject to itself so the client can be recreated
         */
        // eslint-disable-next-line no-unused-vars
        const { puppeteer, ...propertiesObjectWithoutPuppeteer } = propertiesObject
        propertiesObject['__propertiesObject__'] = { value: propertiesObjectWithoutPuppeteer }

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
                /**
                 * add command to every multiremote instance
                 */
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

        /**
         * overwriteCommand
         * @param  {String}   name              command name to be overwritten
         * @param  {Function} func              function to replace original command with;
         *                                      takes original function as first argument.
         * @param  {boolean=} attachToElement   overwrite browser command (false) or element command (true)
         * @param  {Object=}  proto             prototype to add function to (optional)
         * @param  {Object=}  instances         multiremote instances
         */
        client.overwriteCommand = function (name, func, attachToElement = false, proto, instances) {
            let customCommand = typeof commandWrapper === 'function'
                ? commandWrapper(name, func)
                : func
            if (attachToElement) {
                if (instances) {
                    /**
                     * add command to every multiremote instance
                     */
                    Object.values(instances).forEach(instance => {
                        instance.__propertiesObject__.__elementOverrides__.value[name] = customCommand
                    })
                } else {
                    /**
                     * regular mode
                     */
                    this.__propertiesObject__.__elementOverrides__.value[name] = customCommand
                }
            } else if (client[name]) {
                const origCommand = client[name]
                delete client[name]
                unit.lift(name, customCommand, proto, (...args) => origCommand.apply(this, args))
            } else {
                throw new Error('overwriteCommand: no command to be overwritten: ' + name)
            }
        }

        return client
    }

    /**
     * Enhance monad prototype with function
     * @param  {String}   name          name of function to attach to prototype
     * @param  {Function} func          function to be added to prototype
     * @param  {Object}   proto         prototype to add function to (optional)
     * @param  {Function} origCommand   original command to be passed to custom command as first argument
     */
    unit.lift = function (name, func, proto, origCommand) {
        (proto || prototype)[name] = function next (...args) {
            log.info('COMMAND', commandCallStructure(name, args))

            /**
             * set name of function for better error stack
             */
            Object.defineProperty(func, 'name', {
                value: name,
                writable: false,
            })

            const result = func.apply(this, origCommand ? [origCommand, ...args] : args)

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
