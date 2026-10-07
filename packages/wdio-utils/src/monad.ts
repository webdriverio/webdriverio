import logger from '@wdio/logger'
import { type CustomCommands, MESSAGE_TYPES, workerProcessEvent, type Workers } from '@wdio/types'
import _mitt from 'mitt'

import { resolveCustomCommandOptions } from './customCommands.js'
import { commandCallStructure, overwriteElementCommands } from './utils.js'

/**
 * commands added with `addCommand(name, fn, { attachToElement: true })`, so
 * elements keep them even if a browser command has the same name, e.g. `scroll`
 */
export const CUSTOM_ELEMENT_COMMANDS = new WeakSet<Function>()

const SCOPE_TYPES: Record<string, Function> = {
    browser: /* istanbul ignore next */ function Browser() { },
    element: /* istanbul ignore next */ function Element() { }
}

/**
 * @see https://github.com/developit/mitt/issues/191
 */
const mitt = _mitt as unknown as typeof _mitt.default
const EVENTHANDLER_FUNCTIONS = ['on', 'off', 'emit', 'once', 'removeListener', 'removeAllListeners'] as const

interface PropertiesObject {
    [key: string | symbol]: PropertyDescriptor
}

function composeElementOverrides(previousCommand: Function | undefined, nextCommand: Function): Function {
    if (!previousCommand) {
        return nextCommand
    }

    const previousElementCommand = previousCommand

    return function composedElementOverride(this: WebdriverIO.Element, originalCommand: Function, ...args: unknown[]) {
        const element = this

        function previousCommandAsOriginal(this: WebdriverIO.Element, ...previousArgs: unknown[]) {
            const context = this || element

            function originalForPrevious(this: WebdriverIO.Element, ...originalArgs: unknown[]) {
                return originalCommand.apply(this || context, originalArgs)
            }

            return previousElementCommand.call(context, originalForPrevious, ...previousArgs)
        }

        return nextCommand.call(element, previousCommandAsOriginal, ...args)
    }
}

function setElementOverride(overrides: Record<string, Function>, name: string, command: Function): void {
    overrides[name] = composeElementOverrides(overrides[name], command)
}

/**
 * the commands of the clients of a list, see `shareCommands`
 */
const SHARED_COMMANDS = Symbol('wdio:sharedCommands')

interface SharedCommands {
    /**
     * the object with the wrapped commands that the prototype of each client inherits from
     */
    commands: object
    /**
     * the descriptors that each client defines on itself: the event functions of the map (the
     * prototype of each client also has them, and the client must keep the ones of the map),
     * and a getter that makes the own `__propertiesObject__` of the client on its first read
     */
    own: PropertiesObject
    /**
     * the options and the command wrapper of the list, which every client uses
     */
    options: object
    commandWrapper?: Function
}

/**
 * The descriptors of a client: its own copy of the map, the wrapped commands, the element
 * overrides and `__propertiesObject__`. The descriptors of the caller do not change. A caller
 * can give the same object to the monad of many clients, e.g. `getElements` to all items of a
 * list. Wrapped in place, the commands of each new client were wrapped again: item `[n]` had
 * `n + 1` layers.
 */
function clientProperties(this: void, options: object, properties: PropertiesObject, commandWrapper?: Function): PropertiesObject {
    const propertiesObject: PropertiesObject = { ...properties }
    delete propertiesObject.scope

    /**
     * capabilities attached to the instance prototype not being shown if
     * logging the instance
     */
    propertiesObject.commandList = { value: Object.keys(propertiesObject) }
    propertiesObject.options = { value: options }
    if ('requestedCapabilities' in options) {
        propertiesObject.requestedCapabilities = { value: (options as { requestedCapabilities: unknown }).requestedCapabilities }
    }

    /**
     * allow to wrap commands if necessary
     * e.g. in wdio-cli to allow element chaining
     */
    if (typeof commandWrapper === 'function') {
        for (const [commandName, descriptor] of Object.entries(propertiesObject)) {
            const { value } = descriptor
            /**
             * no need to apply a command wrapper if:
             * - there is no wrapper
             * - command is an event handler function
             */
            if (typeof value !== 'function' || (EVENTHANDLER_FUNCTIONS as readonly string[]).includes(commandName)) {
                continue
            }

            propertiesObject[commandName] = {
                ...descriptor,
                value: commandWrapper(commandName, value, propertiesObject),
                configurable: true
            }
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
    return propertiesObject
}

/**
 * The properties for the monads of many clients with the same commands, e.g. the items of a
 * list: the commands are wrapped once, on one object that each client inherits from, instead
 * of on each client (about 280 properties). Each client still has its own prototype (its
 * events and the commands that `addCommand` / `overwriteCommand` add to it).
 *
 * Every client uses the `options` and the command wrapper given here, also when its monad gets
 * others.
 *
 * Internal: `webdriverio` uses it for element lists. It is not a public API and can change in any
 * release.
 */
export function shareCommands(options: object, properties: PropertiesObject, commandWrapper?: Function): PropertiesObject {
    const scopeType = SCOPE_TYPES[properties.scope?.value || 'browser']
    const descriptors = clientProperties(options, properties, commandWrapper)
    const own: PropertiesObject = {}
    for (const name of EVENTHANDLER_FUNCTIONS) {
        if (descriptors[name]) {
            own[name] = descriptors[name]
        }
    }
    /**
     * Each client has its own `__propertiesObject__`, as a client with its own commands does:
     * `addCommand` / `overwriteCommand` with `attachToElement` write into it, and the queries
     * of a multi-remote element read it. It is made on the first read, so a client that never
     * uses it costs nothing.
     */
    const snapshot = descriptors.__propertiesObject__.value as PropertiesObject
    own.__propertiesObject__ = {
        configurable: true,
        get (this: object) {
            const value = { ...snapshot, __elementOverrides__: { value: {} } }
            Object.defineProperty(this, '__propertiesObject__', { value })
            return value
        }
    }
    const shared: SharedCommands = { commands: Object.create(scopeType.prototype, descriptors), own, options, commandWrapper }
    return { scope: properties.scope, [SHARED_COMMANDS]: { value: shared } }
}

export default function WebDriver(monadOptions: object, modifier?: Function, properties: PropertiesObject = {}) {
    /**
     * In order to allow named scopes for elements we have to propagate that
     * info within the `propertiesObject` object. This doesn't have any functional
     * advantages just provides better description of objects when debugging them
     */
    const scopeType = SCOPE_TYPES[properties.scope?.value || 'browser']

    const shared = properties[SHARED_COMMANDS]?.value as SharedCommands | undefined
    /**
     * a client of a list uses the options of the list, see `shareCommands`
     */
    const options = shared ? shared.options : monadOptions
    const prototype = Object.create(shared ? shared.commands : scopeType.prototype)

    /**
     * Put a function on a prototype. The own prototype of the client gets it defined, with the
     * attributes of an assignment: for a client of a list it inherits the read-only commands of
     * the list (see `shareCommands`), where an assignment throws. Another prototype (`proto`)
     * gets an assignment, which keeps the attributes of a method that it already has.
     */
    const setOnPrototype = (target: Record<string | symbol, unknown>, name: string, value: Function) => {
        if (target === prototype) {
            Object.defineProperty(target, name, { configurable: true, enumerable: true, writable: true, value })
        } else {
            target[name] = value
        }
    }
    const log = logger('webdriver')

    const mittInstance = mitt()

    type EventHandler = (event: unknown) => void
    const dialogListeners: Array<{ listener: EventHandler, registered: EventHandler }> = []

    const emitDialogListenerTransition = (previousCount: number) => {
        if (previousCount === 0 && dialogListeners.length > 0) {
            mittInstance.emit('_dialogListenerRegistered')
        } else if (previousCount > 0 && dialogListeners.length === 0) {
            mittInstance.emit('_dialogListenerRemoved')
        }
    }

    const addDialogListener = (listener: EventHandler, registered = listener) => {
        const previousCount = dialogListeners.length
        mittInstance.on('dialog', registered)
        dialogListeners.push({ listener, registered })
        emitDialogListenerTransition(previousCount)
    }

    const removeDialogListener = (listener?: EventHandler, registered?: EventHandler) => {
        const previousCount = dialogListeners.length
        let index = -1

        for (let i = dialogListeners.length - 1; i >= 0; i--) {
            const entry = dialogListeners[i]
            if (registered ? entry.registered === registered : entry.listener === listener) {
                index = i
                break
            }
        }

        if (index === -1) {
            return
        }

        const [entry] = dialogListeners.splice(index, 1)
        mittInstance.off('dialog', entry.registered)
        emitDialogListenerTransition(previousCount)
    }

    const removeAllDialogListeners = () => {
        const previousCount = dialogListeners.length
        mittInstance.off('dialog')
        dialogListeners.length = 0
        emitDialogListenerTransition(previousCount)
    }

    // Create EventEmitter-compatible interface
    const eventHandler = {
        on: (type: string, handler: EventHandler) => {
            if (type === 'dialog') {
                addDialogListener(handler)
            } else {
                mittInstance.on(type, handler)
            }
        },
        off: (type: string, handler?: EventHandler) => {
            if (type === 'dialog') {
                if (handler) {
                    removeDialogListener(handler)
                } else {
                    removeAllDialogListeners()
                }
            } else {
                mittInstance.off(type, handler)
            }
        },
        emit: mittInstance.emit.bind(mittInstance),
        once: (type: string, handler: EventHandler) => {
            const onceWrapper = (event: unknown) => {
                if (type === 'dialog') {
                    removeDialogListener(handler, onceWrapper)
                } else {
                    mittInstance.off(type, onceWrapper)
                }
                handler(event)
            }

            if (type === 'dialog') {
                addDialogListener(handler, onceWrapper)
            } else {
                mittInstance.on(type, onceWrapper)
            }
        },
        removeListener: (type: string, handler?: EventHandler) => {
            if (type === 'dialog') {
                if (handler) {
                    removeDialogListener(handler)
                } else {
                    removeAllDialogListeners()
                }
            } else {
                mittInstance.off(type, handler)
            }
        },
        removeAllListeners: (type?: string) => {
            if (type === 'dialog') {
                removeAllDialogListeners()
            } else if (type) {
                mittInstance.off(type)
            } else {
                const previousCount = dialogListeners.length
                mittInstance.off('dialog')
                dialogListeners.length = 0
                emitDialogListenerTransition(previousCount)
                mittInstance.all.clear()
            }
        }
    }

    /**
     * WebDriver monad
     */
    function unit(this: void, sessionId: string, clientCommandWrapper?: Function, elementCmdImplicitWaitExclusionList?: string[]) {
        /**
         * a client of a list wraps the commands that it adds as the list wraps its commands
         */
        const commandWrapper = shared ? shared.commandWrapper : clientCommandWrapper
        let client = shared
            ? Object.create(prototype, shared.own)
            : Object.create(prototype, clientProperties(options, properties, commandWrapper))
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

        client.addCommand = function (name: string, func: Function | Promise<unknown>, options?: CustomCommands.CustomCommandOptions<boolean>) {
            const { attachToElement, disableElementImplicitWait, proto: _proto, instances: _instances } = resolveCustomCommandOptions('addCommand', options)

            const customCommand = typeof commandWrapper === 'function'
                ? commandWrapper(name, func)
                : func
            if (attachToElement) {
                if (disableElementImplicitWait && elementCmdImplicitWaitExclusionList && !elementCmdImplicitWaitExclusionList.includes(name)) {
                    elementCmdImplicitWaitExclusionList.push(name)
                }

                /**
                 * add command to every multi-remote instance
                 */
                if (_instances) {
                    Object.values(_instances).forEach((instance: { __propertiesObject__: Record<string, unknown> }) => {
                        instance.__propertiesObject__[name] = {
                            value: customCommand
                        }
                    })
                }

                this.__propertiesObject__[name] = { value: customCommand }
                CUSTOM_ELEMENT_COMMANDS.add(customCommand)
            } else if (
                /**
                 * A client of a list that adds a command with the name of a command of the list
                 * keeps the command of the list, as a client with its own commands does (its own
                 * property hides the one of its prototype). After an overwrite of that client,
                 * which removed its own property, the added command replaces the overwrite.
                 */
                !(shared && !_proto &&
                    Object.prototype.hasOwnProperty.call(shared.commands, name) &&
                    !Object.prototype.hasOwnProperty.call(prototype, name))
            ) {
                unit.lift(name, customCommand, _proto)
            }

            /**
             * When running component tests, custom commands might not be recognised when services attach them to the browser.
             * This is because the `addCommand` function is called within the Node.js environment and not the browser.
             * As a workaround, we check here if we are in a worker process and if so we send a message to the parent process
             * to add the command to the browser.
             *
             * @todo(Christian): this won't be sufficient, e.g. in cases where the page is reloaded and the command is not re-added.
             */
            const workerId = process.env.WDIO_WORKER_ID
            if (typeof process.send === 'function' && workerId) {
                const message: Workers.WorkerEvent = {
                    origin: 'worker',
                    name: 'workerEvent',
                    args: workerProcessEvent(MESSAGE_TYPES.customCommand, {
                        commandName: name,
                        cid: workerId,
                    })
                }
                process.send(message)
            }
        }

        /**
         * overwriteCommand
         * @param  {string}   name     command name to be overwritten
         * @param  {Function} func     function to replace original command with;
         *                             takes original function as first argument.
         * @param  {Object=}  options  `{ attachToElement, proto, instances }`
         */
        client.overwriteCommand = function (name: string, func: Function, options?: CustomCommands.CustomCommandOptions<boolean>) {
            const { attachToElement, proto, instances } = resolveCustomCommandOptions('overwriteCommand', options)
            const customCommand = typeof commandWrapper === 'function'
                ? commandWrapper(name, func)
                : func
            if (attachToElement) {
                if (instances) {
                    /**
                     * add command to every multi-remote instance
                     */
                    Object.values(instances).forEach((instance: { __propertiesObject__: { __elementOverrides__: { value: Record<string, Function> } } }) => {
                        setElementOverride(instance.__propertiesObject__.__elementOverrides__.value, name, customCommand)
                    })
                } else {
                    /**
                     * regular mode
                     */
                    setElementOverride(this.__propertiesObject__.__elementOverrides__.value, name, customCommand)
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
    unit.lift = function (name: string, func: Function, proto?: Record<string, any>, origCommand?: Function) {
        setOnPrototype(proto || prototype, name, function next(this: { emit: (event: string, payload: unknown) => unknown }, ...args: unknown[]) {
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
                            result: { value: res }
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
        })
    }

    /**
     * register event emitter
     */
    for (const eventCommand of EVENTHANDLER_FUNCTIONS) {
        setOnPrototype(prototype, eventCommand, function (this: unknown, ...args: [unknown, unknown]) {
            // Call the appropriate method based on eventCommand
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
            case 'once':
                eventHandler.once(args[0] as string, args[1] as (event: unknown) => void)
                break
            case 'removeAllListeners':
                eventHandler.removeAllListeners(args[0] as string)
                break
            }
            return this
        })
    }

    return unit
}

const isPromiseLike = (value: unknown): value is Promise<unknown> => {
    return value !== null && typeof value === 'object' && typeof (value as Promise<unknown>).then === 'function' && typeof (value as Promise<unknown>).catch === 'function'
}
