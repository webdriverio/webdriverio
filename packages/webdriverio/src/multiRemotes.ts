import zip from 'lodash.zip'
import clone from 'lodash.clonedeep'
import { webdriverMonad, wrapCommand } from '@wdio/utils'
import type { Options } from '@wdio/types'
import type { ProtocolCommands } from '@wdio/protocols'

import { multiremoteHandler } from './middlewares.js'
import { addLocatorStrategyHandler, enhanceElementsArray, getPrototype } from './utils/index.js'
import type { BrowserCommandsType, Selector, WebdriverIOEventMap } from './types.js'

import * as BrowserCommands from './commands/browser.js'

const overridableCommands = new Set(Object.keys(BrowserCommands))

type EventEmitter = (args: unknown) => void
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
            value: (browserName: string) => this.instances.get(browserName)
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
     * or in case multiremote is used
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
        selector?: string,
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
            client.selector = selector ?? (Array.isArray(result) && result[0]
                ? result[0].selector
                : null)
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
                        throw new Error(`MultiRemote object has no instance named "${browserName}"`)
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

        return element(sessionId, multiremoteHandler(scope.commandWrapper.bind(scope)))
    }

    /**
     * handle commands for multiremote instances
     */
    commandWrapper (commandName: keyof (ProtocolCommands & BrowserCommandsType) & 'getInstance') {
        const instances = this.instances
        const self: MultiRemote = this

        return wrapCommand(commandName, async function (this: WebdriverIO.MultiRemoteBrowser | WebdriverIO.MultiRemoteElement, ...args: unknown[]) {
            const thisElement = this as WebdriverIO.MultiRemoteElement
            const isElementScope = Boolean(thisElement.selector)
            const scopeEntries: [string, WebdriverIO.Browser | WebdriverIO.Element][] = isElementScope
                ? thisElement.instances.map((instanceName) => [instanceName, thisElement.getInstance(instanceName)])
                : [...instances.entries()]

            const result = await Promise.all(
                scopeEntries.map(([, instance]) => {
                    const command = (instance as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>)[commandName as string]
                    return command.call(instance, ...args)
                })
            )

            // Narrow instances to only those actually used in this command call
            const activeInstances = isElementScope
                ? new Map(thisElement.instances.map((instanceName) => {
                    const browserInstance = instances.get(instanceName)
                    if (!browserInstance) {
                        throw new Error(`MultiRemote object has no instance named "${instanceName}"`)
                    }
                    return [instanceName, browserInstance] as const
                }))
                : instances

            /**
             * return element object to call commands directly
             */
            if (commandName === '$') {
                return MultiRemote.elementWrapper(activeInstances, result, this.__propertiesObject__, self)
            } else if (commandName === '$$') {
                const selector = args[0] as Selector
                const zippedResult = zip(...(result as unknown[][]))
                const wrappedResult = zippedResult.map((singleResult) => MultiRemote.elementWrapper(activeInstances, singleResult, this.__propertiesObject__, self, typeof selector === 'string' ? selector : undefined))

                const elementArray = enhanceElementsArray(
                    wrappedResult,
                    this,
                    selector,
                    commandName
                )

                elementArray.isMultiRemote = true
                return elementArray
            }
            return result
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
        this.instances.forEach((instanceName) => this.getInstance(instanceName)!.on(eventName, emitter))
        return undefined
    }

    once (this: WebdriverIO.MultiRemoteBrowser, eventName: keyof WebdriverIOEventMap, emitter: EventEmitter) {
        this.instances.forEach((instanceName) => this.getInstance(instanceName)!.once(eventName, emitter))
        return undefined
    }

    emit (this: WebdriverIO.MultiRemoteBrowser, eventName: keyof WebdriverIOEventMap, emitter: EventEmitter) {
        return this.instances.map(
            (instanceName) => this.getInstance(instanceName)!.emit(eventName, emitter)
        ).some(Boolean)
    }

    eventNames (this: WebdriverIO.MultiRemoteBrowser) {
        return this.instances.map(
            (instanceName) => this.getInstance(instanceName)!.eventNames()
        )
    }

    getMaxListeners (this: WebdriverIO.MultiRemoteBrowser) {
        return this.instances.map(
            (instanceName) => this.getInstance(instanceName)!.getMaxListeners()
        )
    }

    listenerCount (this: WebdriverIO.MultiRemoteBrowser, eventName: string) {
        return this.instances.map(
            (instanceName) => this.getInstance(instanceName)!.listenerCount(eventName)
        )
    }

    listeners (this: WebdriverIO.MultiRemoteBrowser, eventName: string) {
        return this.instances.map(
            (instanceName) => this.getInstance(instanceName)!.listeners(eventName)
        ).reduce((prev, cur) => {
            prev.concat(cur)
            return prev
        }, [])
    }

    removeListener (this: WebdriverIO.MultiRemoteBrowser, eventName: string, emitter: EventEmitter) {
        this.instances.forEach((instanceName) => this.getInstance(instanceName)!.removeListener(eventName, emitter))
        return undefined
    }

    removeAllListeners (this: WebdriverIO.MultiRemoteBrowser, eventName: string) {
        this.instances.forEach((instanceName) => this.getInstance(instanceName)!.removeAllListeners(eventName))
        return undefined
    }
}
