import clone from 'lodash.clonedeep'
import { isLoadedElement, setWdioKind, webdriverMonad, wrapCommand } from '@wdio/utils'
import type { Options } from '@wdio/types'
import type { ProtocolCommands } from '@wdio/protocols'

import { multiRemoteHandler } from './middlewares.js'
import { MultiRemoteMock } from './multiRemoteMock.js'
import { ElementArray } from './element/array.js'
import { addLocatorStrategyHandler, getPrototype } from './utils/index.js'
import type { BrowserCommandsType, Selector, WebdriverIOEventMap } from './types.js'

import * as BrowserCommands from './commands/browser.js'

const overridableCommands = new Set(Object.keys(BrowserCommands))

/**
 * queries that find one element per instance, wrapped into one multi-remote element
 */
const SINGLE_QUERIES = new Set(['$', 'custom$', 'react$', 'shadow$', 'nextElement', 'previousElement', 'parentElement'])
/**
 * queries that find a list per instance, zipped into one multi-remote list
 */
const LIST_QUERIES = new Set(['$$', 'custom$$', 'react$$', 'shadow$$'])

type EventEmitter = (args: unknown) => void

/**
 * Groups the elements of each instance by index. An index past the end of an
 * `ElementArray` is a lazy element that waits and then rejects, so an instance
 * with fewer elements gets `undefined` (#15845).
 */
function zipElements (lists: WebdriverIO.Element[][]) {
    const length = Math.max(0, ...lists.map((list) => list.length))
    return Array.from({ length }, (_, index) => lists.map((list) => index < list.length ? list[index] : undefined))
}

/**
 * A multi-remote element has no element id of its own, so a command argument
 * holding one gets the element of the instance the command runs on (#15844).
 * Only data properties are read, so a getter of an unrelated object never runs.
 * `converted` maps every array or object seen to its result, so an object
 * reached twice is converted once and a cycle ends.
 */
function toInstanceArg (arg: unknown, instanceName: string, converted = new Map<object, unknown>()): unknown {
    if (!arg || typeof arg !== 'object') {
        return arg
    }
    if (converted.has(arg)) {
        return converted.get(arg)
    }

    const element = arg as WebdriverIO.MultiRemoteElement
    if (isLoadedElement(arg) && element.isMultiRemote) {
        if (!element.instances.includes(instanceName)) {
            throw new Error(`Element "${String(element.selector)}" is not available on instance "${instanceName}"`)
        }
        return element.getInstance(instanceName)
    }

    if (Array.isArray(arg)) {
        converted.set(arg, arg)
        const items = Array.from(arg, (item) => toInstanceArg(item, instanceName, converted))
        const result = items.some((item, index) => item !== arg[index]) ? items : arg
        converted.set(arg, result)
        return result
    }

    const prototype = Object.getPrototypeOf(arg)
    if (prototype !== Object.prototype && prototype !== null) {
        return arg
    }

    converted.set(arg, arg)
    const descriptors = Object.getOwnPropertyDescriptors(arg)
    let changed = false
    for (const descriptor of Object.values(descriptors)) {
        if ('value' in descriptor) {
            const value = toInstanceArg(descriptor.value, instanceName, converted)
            changed ||= value !== descriptor.value
            descriptor.value = value
        }
    }
    const result = changed ? Object.create(prototype, descriptors) : arg
    converted.set(arg, result)
    return result
}
type WrappedClient = {
    options: Options.WebdriverIO,
    commandList: (keyof (ProtocolCommands & BrowserCommandsType) & 'getInstance' & 'select')[],
    __propertiesObject__?: Record<string, PropertyDescriptor>
}

/**
 * MultiRemote class
 */
export default class MultiRemote {
    /**
     * Browser sessions in capability order. Instance names are map keys,
     * not properties of the browser client.
     */
    instances: Map<string, WebdriverIO.Browser> = new Map()
    baseInstance?: MultiRemoteDriver
    sessionId?: string

    /**
     * add instance to multibrowser instance
     */
    async addInstance (browserName: string, client: WebdriverIO.Browser) {
        this.instances.set(browserName, client)
        return client
    }

    /**
     * modifier for multibrowser instance
     */
    modifier (wrapperClient: WrappedClient) {
        const modifierThis: MultiRemote = this

        // Allows to preserve element scope custom commands
        const propertiesObject: Record<string, PropertyDescriptor> = Object.fromEntries(
            Object.entries(wrapperClient.__propertiesObject__ ?? {}).map(([name, descriptor]) => [name, { ...descriptor }])
        )
        propertiesObject.commandList = { value: wrapperClient.commandList }
        propertiesObject.options = { value: wrapperClient.options }
        propertiesObject.getInstance = {
            value: (browserName: string) => {
                const instance = this.instances.get(browserName)
                if (!instance) {
                    throw new Error(`Multi-remote object has no instance named "${browserName}"`)
                }
                return instance
            }
        }

        propertiesObject.select = {
            value: function select(this: WebdriverIO.MultiRemoteBrowser & WrappedClient, ...instanceNames: string[]) {
                const newMultiRemote = new MultiRemote()
                for (const name of instanceNames) {
                    const instance = modifierThis.instances.get(name)
                    if (instance) {
                        newMultiRemote.instances.set(name, instance)
                    }
                }

                if (newMultiRemote.instances.size === 0) {
                    throw new Error('None of the following requested instances are valid: ' + instanceNames.join(', '))
                }

                return newMultiRemote.modifier(this)
            },
            configurable: true,
            writable: true
        }

        for (const commandName of wrapperClient.commandList) {
            // Preserved overridden commands
            if (!Object.prototype.hasOwnProperty.call(wrapperClient, commandName) && overridableCommands.has(commandName)) {
                delete propertiesObject[commandName]
                continue
            }

            /**
             * Wrap commands only that are functions, else it breaks the interface type:
             * `strategies` is a Map on the command list, and wrapping it would shadow
             * the map with a command function (#15540).
             */
            const isFunction = typeof wrapperClient[commandName] === 'function'
            propertiesObject[commandName] = {
                value: isFunction ? this.commandWrapper(commandName) : wrapperClient[commandName],
                configurable: true
            }
        }

        /**
         * The wrapper client needs its own `strategies` map so
         * `addLocatorStrategy` does not crash and can be propagated to the
         * instances by `addLocatorStrategyHandler` (#15540). This is set after
         * the command-wrapping loop above on purpose: `strategies` is part of a
         * browser's `commandList`, so the loop would otherwise wrap it as a
         * command function and shadow the map.
         *
         * When `select()` re-runs the modifier, reuse the existing map carried
         * over via `__propertiesObject__` so the selected browser keeps
         * previously registered strategies; otherwise start with a fresh map.
         */
        const inheritedStrategies = wrapperClient.__propertiesObject__?.strategies?.value as Map<unknown, unknown> | undefined
        propertiesObject.strategies = { value: inheritedStrategies ?? new Map() }

        propertiesObject.__propertiesObject__ = {
            value: propertiesObject
        }

        this.baseInstance = new MultiRemoteDriver(this.instances, propertiesObject)
        const client = Object.create(this.baseInstance, propertiesObject)

        // Preserve addLocatorStrategy if it exists on the wrapper client
        if (Object.prototype.hasOwnProperty.call(wrapperClient, 'addLocatorStrategy')) {
            client.addLocatorStrategy = addLocatorStrategyHandler(client)
        }

        return client
    }

    /**
     * helper method to generate element objects from results, so that we can call, e.g.
     *
     * ```
     * const elem = $('#elem')
     * elem.getHTML()
     * ```
     *
     * or in case multi-remote is used
     *
     * ```
     * const elems = $$('div')
     * elems[0].getHTML()
     * ```
     */
    static elementWrapper (
        instances: Map<string, WebdriverIO.Browser>,
        result: unknown,
        propertiesObject: Record<string, PropertyDescriptor>,
        scope: MultiRemote,
    ): WebdriverIO.MultiRemoteElement {
        const prototype = { ...propertiesObject, ...clone(getPrototype('element')), scope: { value: 'element' } }
        const results = Array.isArray(result) ? result as WebdriverIO.Element[] : []

        const element = webdriverMonad({}, (client: WebdriverIO.MultiRemoteElement) => {
            const byName = new Map<string, WebdriverIO.Element>()
            let index = 0
            for (const identifier of instances.keys()) {
                byName.set(identifier, results[index])
                index++
            }
            client.instances = [...instances.keys()]
            client.isMultiRemote = true
            setWdioKind(client, 'element')
            /**
             * An entry of a list can have no element for the first instance (#15845), so take
             * the selector of the first instance that has one. A command on an element without
             * a selector runs on the browsers, so on the full page of each one. The queries of
             * WebdriverIO always give at least one element; only an overwritten query that
             * returns nothing leaves the selector undefined, as the `null` of before.
             */
            const firstElement = results.find(Boolean)
            if (firstElement) {
                client.selector = firstElement.selector
            }
            // @ts-expect-error ToDo(Christian): remove eventually
            delete client.sessionId

            /**
             * `getInstance` is installed by the command wrapper before this
             * modifier runs, and that descriptor is not writable.
             */
            Object.defineProperty(client, 'getInstance', {
                configurable: true,
                writable: true,
                value (browserName: string) {
                    const found = byName.get(browserName)
                    if (!found) {
                        throw new Error(`Multi-remote object has no instance named "${browserName}"`)
                    }
                    return found
                }
            })

            client.select = function select(...instanceNames: string[]) {
                const selectedResults: WebdriverIO.Element[] = []
                const selectedInstances = new Map<string, WebdriverIO.Browser>()

                for (const name of instanceNames) {
                    if (!client.instances.includes(name)) {
                        continue
                    }
                    const browserInstance = scope.instances.get(name)
                    if (!browserInstance) {
                        continue
                    }
                    selectedInstances.set(name, browserInstance)
                    selectedResults.push(client.getInstance(name))
                }

                if (selectedInstances.size === 0) {
                    throw new Error('None of the following requested instances are valid: ' + instanceNames.join(', '))
                }

                return MultiRemote.elementWrapper(selectedInstances, selectedResults, propertiesObject, scope)
            }

            return client
        }, prototype)

        // @ts-expect-error
        const sessionId = this.sessionId

        return element(sessionId, multiRemoteHandler(scope.commandWrapper.bind(scope)))
    }

    /**
     * handle commands for multi-remote instances
     */
    commandWrapper (commandName: keyof (ProtocolCommands & BrowserCommandsType) & 'getInstance') {
        const instances = this.instances
        const self: MultiRemote = this

        return wrapCommand(commandName, function (this: WebdriverIO.MultiRemoteBrowser | WebdriverIO.MultiRemoteElement, ...args: unknown[]) {
            const execute = async () => {
                const thisElement = this as WebdriverIO.MultiRemoteElement
                const isElementScope = Boolean(thisElement.selector)
                const scopeEntries: [string, WebdriverIO.Browser | WebdriverIO.Element][] = isElementScope
                    ? thisElement.instances.map((instanceName) => [instanceName, thisElement.getInstance(instanceName)])
                    : [...instances.entries()]

                /**
                 * convert the arguments of every instance first, so an element missing
                 * on one instance throws before the command starts on any other
                 */
                const instanceArgs = scopeEntries.map(
                    ([instanceName]) => args.map((arg) => toInstanceArg(arg, instanceName))
                )
                const result = await Promise.all(
                    scopeEntries.map(([, instance], index) => {
                        const command = (instance as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>)[commandName as string]
                        return command.call(instance, ...instanceArgs[index])
                    })
                )

                // Narrow instances to only those actually used in this command call
                const activeInstances = isElementScope
                    ? new Map(thisElement.instances.map((instanceName) => {
                        const browserInstance = instances.get(instanceName)
                        if (!browserInstance) {
                            throw new Error(`Multi-remote object has no instance named "${instanceName}"`)
                        }
                        return [instanceName, browserInstance] as const
                    }))
                    : instances

                return { result, activeInstances, scopeEntries }
            }

            /**
             * A list query has to return the element list synchronously. An async
             * function would unwrap the thenable list before the caller can
             * iterate it.
             */
            if (LIST_QUERIES.has(commandName)) {
                const [selector, ...props] = args as [Selector, ...unknown[]]
                let loadedInstances = instances
                const wrapMultiRemote = (elements: unknown) => MultiRemote.elementWrapper(
                    loadedInstances,
                    elements,
                    this.__propertiesObject__,
                    self
                )
                return ElementArray.fromAsyncCallback(async () => {
                    const { result, activeInstances } = await execute()
                    loadedInstances = activeInstances
                    return zipElements(result as WebdriverIO.Element[][]).map(wrapMultiRemote)
                }, {
                    selector,
                    foundWith: commandName,
                    parent: this,
                    /**
                     * the arguments after the selector, so that
                     * `parent[foundWith](selector, ...props)` runs the same query again
                     */
                    props,
                    isMultiRemote: true,
                    wrapMultiRemote
                })
            }

            return (async () => {
                const { result, activeInstances, scopeEntries } = await execute()
                /**
                 * return element object to call commands directly
                 */
                if (SINGLE_QUERIES.has(commandName)) {
                    return MultiRemote.elementWrapper(activeInstances, result, this.__propertiesObject__, self)
                } else if (commandName === 'mock') {
                    /**
                     * A plain array cannot say which browser a mock belongs to, and
                     * `select()` can reorder instances relative to `browser.instances`
                     * (#15726).
                     */
                    return new MultiRemoteMock(
                        scopeEntries.map(([instanceName]) => instanceName),
                        result as WebdriverIO.Mock[]
                    )
                }
                return result
            })()
        })
    }
}

/**
 * event listener class that propagates events to sub drivers
 */
/* istanbul ignore next */
export class MultiRemoteDriver {
    instances: string[]
    isMultiRemote = true as const
    __propertiesObject__: Record<string, PropertyDescriptor>

    constructor (
        instances: Map<string, WebdriverIO.Browser>,
        propertiesObject: Record<string, PropertyDescriptor>
    ) {
        this.instances = [...instances.keys()]
        this.__propertiesObject__ = propertiesObject
    }

    on (this: WebdriverIO.MultiRemoteBrowser, eventName: keyof WebdriverIOEventMap, emitter: EventEmitter) {
        this.instances.forEach((instanceName) => this.getInstance(instanceName).on(eventName, emitter))
        return undefined
    }

    once (this: WebdriverIO.MultiRemoteBrowser, eventName: keyof WebdriverIOEventMap, emitter: EventEmitter) {
        this.instances.forEach((instanceName) => this.getInstance(instanceName).once(eventName, emitter))
        return undefined
    }

    emit (this: WebdriverIO.MultiRemoteBrowser, eventName: keyof WebdriverIOEventMap, emitter: EventEmitter) {
        return this.instances.map(
            (instanceName) => this.getInstance(instanceName).emit(eventName, emitter)
        ).some(Boolean)
    }

    eventNames (this: WebdriverIO.MultiRemoteBrowser) {
        return this.instances.map(
            (instanceName) => this.getInstance(instanceName).eventNames()
        )
    }

    getMaxListeners (this: WebdriverIO.MultiRemoteBrowser) {
        return this.instances.map(
            (instanceName) => this.getInstance(instanceName).getMaxListeners()
        )
    }

    listenerCount (this: WebdriverIO.MultiRemoteBrowser, eventName: string) {
        return this.instances.map(
            (instanceName) => this.getInstance(instanceName).listenerCount(eventName)
        )
    }

    listeners (this: WebdriverIO.MultiRemoteBrowser, eventName: string) {
        return this.instances.map(
            (instanceName) => this.getInstance(instanceName).listeners(eventName)
        ).reduce((prev, cur) => {
            prev.concat(cur)
            return prev
        }, [])
    }

    removeListener (this: WebdriverIO.MultiRemoteBrowser, eventName: string, emitter: EventEmitter) {
        this.instances.forEach((instanceName) => this.getInstance(instanceName).removeListener(eventName, emitter))
        return undefined
    }

    removeAllListeners (this: WebdriverIO.MultiRemoteBrowser, eventName: string) {
        this.instances.forEach((instanceName) => this.getInstance(instanceName).removeAllListeners(eventName))
        return undefined
    }
}

/**
 * brand every multi-remote browser as a browser, see `@wdio/utils` `kind.ts` (multi-remote is
 * not part of the brand, read `isMultiRemote`). The modifier copies the commands with
 * `Object.entries`, which skips the `browser` brand of the wrapped driver.
 */
setWdioKind(MultiRemoteDriver.prototype, 'browser')
