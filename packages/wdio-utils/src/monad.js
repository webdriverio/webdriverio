import { EventEmitter } from 'events'
import logger from '@wdio/logger'

import { commandCallStructure, overwriteElementCommands } from './utils'

const SCOPE_TYPES = {
    'browser': /* istanbul ignore next */ function Browser () {},
    'element': /* istanbul ignore next */ function Element () {}
}

export default function WebDriver (options, modifier, propertiesObject = {}) {
    /**
     * In order to allow named scopes for elements, we must propagate that
     * info within the `propertiesObject` object. This doesn't have any functional
     * advantages; it just provides a better description of objects when debugging them.
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
         * Allow wrapping commands if necessary.
         * (e.g., In wdio-cli, to make them synchronous)
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
         * Overwrite native element commands with user-defined commands.
         */
        overwriteElementCommands.call(this, propertiesObject)

        /**
         * Assign propertiesObject to itself so the client can be recreated.
         */
        propertiesObject['__propertiesObject__'] = { value: propertiesObject }

        let client = Object.create(prototype, propertiesObject)
        client.sessionId = sessionId

        /**
         * Register capabilities only to browser scope.
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
         * @param  {String}   name              - Command name to be overwritten
         * @param  {Function} func              - Function to replace original command with;
         *                                      - Takes original function as first argument.
         * @param  {boolean=} attachToElement   - Overwrite browser command (false) or element command (true)
         * @param  {Object=}  proto             - Prototype to add function to (optional)
         * @param  {Object=}  instances         - Multiremote instances
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
     * Enhance monad prototype with function.
     * @param  {String}   name         - Name of function to attach to prototype
     * @param  {Function} func         - Function to be added to prototype
     * @param  {Object}   proto        - Prototype to add function to (optional)
     * @param  {Function} origCommand  - Original command to be passed to custom command as first argument
     */
    unit.lift = function (name, func, proto, origCommand) {
        (proto || prototype)[name] = function next (...args) {
            log.info('COMMAND', commandCallStructure(name, args))

            /**
             * Set the function name for better error stack.
             */
            Object.defineProperty(func, 'name', {
                value: name,
                writable: false,
            })

            const result = func.apply(this, origCommand ? [origCommand, ...args] : args)

            /**
             * Always transform result into a Promise, because we don't know whether the user 
             * is running tests with wdio-sync or not.
             */
            Promise.resolve(result).then((res) => {
                log.info('RESULT', res)
                this.emit('result', { name, result: res })
            }).catch(() => {})

            return result
        }
    }

    /**
     * Register EventEmitter.
     */
    for (let eventCommand in EVENTHANDLER_FUNCTIONS) {
        prototype[eventCommand] = function (...args) {
            eventHandler[eventCommand](...args)
            return this
        }
    }

    return unit
}
