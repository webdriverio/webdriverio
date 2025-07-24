import mitt from 'mitt'
import type { Emitter } from 'mitt'
import logger from '@wdio/logger'
import { WS_MESSAGE_TYPES, type Workers } from '@wdio/types'

import { commandCallStructure, overwriteElementCommands } from './utils.js'

const SCOPE_TYPES: Record<string, Function> = {
    browser: /* istanbul ignore next */ function Browser() { },
    element: /* istanbul ignore next */ function Element() { }
}

const EVENTHANDLER_FUNCTIONS = ['on', 'off', 'emit', 'once', 'removeListener', 'removeAllListeners'] as const

interface PropertiesObject {
    [key: string | symbol]: PropertyDescriptor
}

export default function WebDriver(options: object, modifier?: Function, propertiesObject: PropertiesObject = {}) {
    /**
     * In order to allow named scopes for elements we have to propagate that
     * info within the `propertiesObject` object. This doesn't have any functional
     * advantages just provides better description of objects when debugging them
     */
    const scopeType = SCOPE_TYPES[propertiesObject.scope?.value || 'browser']
    delete propertiesObject.scope

    const prototype = Object.create(scopeType.prototype)
    const log = logger('webdriver')

    let eventHandler: Emitter<Record<string, unknown>> = (mitt as unknown as () => Emitter<Record<string, unknown>>)()

    /**
     * WebDriver monad
     */
    function unit(this: void, sessionId: string, commandWrapper?: Function) {
        /**
         * capabilities attached to the instance prototype not being shown if
         * logging the instance
         */
        propertiesObject.commandList = { value: Object.keys(propertiesObject) }
        propertiesObject.options = { value: options }
        if ('requestedCapabilities' in options) {
            propertiesObject.requestedCapabilities = { value: options.requestedCapabilities }
        }

        /**
         * allow to wrap commands if necessary
         * e.g. in wdio-cli to allow element chaining
         */
        if (typeof commandWrapper === 'function') {
            for (const [commandName, { value }] of Object.entries(propertiesObject)) {
                /**
                 * no need to apply a command wrapper if:
                 * - there is no wrapper
                 * - command is an event handler function
                 */
                if (typeof value !== 'function' || Object.keys(EVENTHANDLER_FUNCTIONS).includes(commandName)) {
                    continue
                }

                propertiesObject[commandName].value = commandWrapper(commandName, value, propertiesObject)
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { puppeteer, ...propertiesObjectWithoutPuppeteer } = propertiesObject
        propertiesObject.__propertiesObject__ = { value: propertiesObjectWithoutPuppeteer }

        let client = Object.create(prototype, propertiesObject)
        client.sessionId = sessionId

        /**
         * register capabilities only to browser scope
         */
        if (scopeType.name === 'Browser' && 'capabilities' in options) {
            client.capabilities = options.capabilities
        }

        if (typeof modifier === 'function') {
            client = modifier(client, options)
        }

        client.addCommand = function (name: string, func: Function, attachToElement = false, proto: Record<string, unknown>, instances?: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser) {
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

            /**
             * When running component tests, custom commands might not be recognised when services attach them to the browser.
             * This is because the `addCommand` function is called within the Node.js environment and not the browser.
             * As a workaround, we check here if we are in a worker process and if so we send a message to the parent process
             * to add the command to the browser.
             *
             * @todo(Christian): this won't be sufficient, e.g. in cases where the page is reloaded and the command is not re-added.
             */
            if (typeof process.send === 'function' && process.env.WDIO_WORKER_ID) {
                const message: Workers.WorkerEvent = {
                    origin: 'worker',
                    name: 'workerEvent',
                    args: {
                        type: WS_MESSAGE_TYPES.customCommand,
                        value: {
                            commandName: name,
                            cid: process.env.WDIO_WORKER_ID,
                        }
                    }
                }
                process.send(message)
            }
        }

        /**
         * overwriteCommand
         * @param  {string}   name              command name to be overwritten
         * @param  {Function} func              function to replace original command with;
         *                                      takes original function as first argument.
         * @param  {boolean=} attachToElement   overwrite browser command (false) or element command (true)
         * @param  {Object=}  proto             prototype to add function to (optional)
         * @param  {Object=}  instances         multiremote instances
         */
        client.overwriteCommand = function (name: string, func: Function, attachToElement = false, proto: Record<string, unknown>, instances?: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser) {
            const customCommand = typeof commandWrapper === 'function'
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
                unit.lift(name, customCommand, proto, (...args: unknown[]) => origCommand.apply(this, args))
            } else {
                throw new Error('overwriteCommand: no command to be overwritten: ' + name)
            }
        }

        return client
    }

    /**
     * Enhance monad prototype with function
     * @param  {string}   name          name of function to attach to prototype
     * @param  {Function} func          function to be added to prototype
     * @param  {Object}   proto         prototype to add function to (optional)
     * @param  {Function} origCommand   original command to be passed to custom command as first argument
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    unit.lift = function (name: string, func: Function, proto: Record<string, any>, origCommand?: Function) {
        (proto || prototype)[name] = function next(...args: unknown[]) {
            log.info('COMMAND', commandCallStructure(name, args))
            this.emit('command', { command: name, body: args })

            /**
             * set name of function for better error stack
             */
            Object.defineProperty(func, 'name', {
                value: name,
                writable: false,
            })

            try {
                const result = func.apply(this, origCommand ? [origCommand, ...args] : args)

                // When the result is a promise, we want to emit on then & catch
                if (isPromiseLike(result)) {
                    result.then((res: unknown) => {

                        const elem = res as { elementId: string, selector?: string }
                        let resultLog = res
                        if (elem instanceof SCOPE_TYPES.element) {
                            resultLog = `WebdriverIO.Element<${elem.elementId || elem.selector}>`
                        } else if (res instanceof SCOPE_TYPES.browser) {
                            resultLog = 'WebdriverIO.Browser'
                        }

                        log.info('RESULT', resultLog)
                        this.emit('result', {
                            command: name,
                            result: { value: res },
                            name // Kept for legacy reasons, as the `command` property is now used in the reporter. To remove one day!
                        })
                    }).catch((error: Error) => {
                        this.emit('result', { command: name, result: { error } })
                    })
                } else {
                    // The function should always be a promise and not trigger the below, but for the sake of being bullet proof let's do it
                    // When a function we can emit the result immediately
                    this.emit('result', { command: name, result: { value: result } })
                }

                return result
            } catch (error) {
                // The function should always be a promise and not trigger this error but for the sake of being bullet proof let's do it
                this.emit('result', { command: name, result: { error } })
                throw error
            }
        }
    }

    /**
     * register event emitter
     */
    for (const eventCommand of EVENTHANDLER_FUNCTIONS) {
        prototype[eventCommand] = function (...args: [unknown, unknown]) {
            switch (eventCommand) {
            case 'on':
                eventHandler.on(args[0] as string, args[1] as (event: unknown) => void)
                break
            case 'off':
            case 'removeListener':
                eventHandler.off(args[0] as string, args[1] as (event: unknown) => void)
                break
            case 'emit':
                eventHandler.emit(args[0] as string, args[1])
                break
            case 'once': {
                // mitt does not support once natively, so we polyfill it
                const handler = (...eventArgs: unknown[]) => {
                    eventHandler.off(args[0] as string, handler)
                    if (typeof args[1] === 'function') {
                        (args[1] as (...args: unknown[]) => void)(...(eventArgs as unknown[]))
                    }
                }
                eventHandler.on(args[0] as string, handler)
                break
            }
            case 'removeAllListeners':
                // mitt does not support removeAllListeners, so we re-instantiate
                eventHandler = (mitt as unknown as () => Emitter<Record<string, unknown>>)()
                break
            }
            return this
        }
    }

    return unit
}

const isPromiseLike = (value: unknown): value is Promise<unknown> => {
    return value !== null && typeof value === 'object' && typeof (value as Promise<unknown>).then === 'function' && typeof (value as Promise<unknown>).catch === 'function'
}