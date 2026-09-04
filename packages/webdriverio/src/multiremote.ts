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
    commandList: (keyof (ProtocolCommands & BrowserCommandsType) & 'getInstance' & 'unstable_select')[],
    __propertiesObject__?: Record<string, PropertyDescriptor>
}

/**
 * Multiremote class
 */
export default class MultiRemote {
    instances: Record<string, WebdriverIO.Browser> = {}
    baseInstance?: MultiRemoteDriver
    sessionId?: string

    /**
     * add instance to multibrowser instance
     */
    async addInstance (browserName: string, client: WebdriverIO.Browser) {
        this.instances[browserName] = client
        return this.instances[browserName]
    }

    /**
     * modifier for multibrowser instance
     */
    modifier (wrapperClient: WrappedClient) {
        const modifierThis: MultiRemote = this
        const enableMultiRemoteSelect = process.env.WDIO_ENABLE_MULTI_REMOTE_SELECT === 'true'

        // Allows to preserve element scope custom commands
        const propertiesObject: Record<string, PropertyDescriptor> = enableMultiRemoteSelect ? Object.fromEntries(
            Object.entries(wrapperClient.__propertiesObject__ ?? {}).map(([name, descriptor]) => [name, { ...descriptor }])
        ) : {}
        propertiesObject.commandList = { value: wrapperClient.commandList }
        propertiesObject.options = { value: wrapperClient.options }
        propertiesObject.getInstance = {
            value: (browserName: string) => this.instances[browserName]
        }

        propertiesObject.unstable_select = {
            value: function unstableSelect(this: WebdriverIO.MultiRemoteBrowser & WrappedClient, ...instanceNames: string[]) {
                const newMultiRemote = new MultiRemote()
                newMultiRemote.instances = instanceNames.reduce((acc, name) => {
                    if (modifierThis.instances[name]) {
                        acc[name] = modifierThis.instances[name]
                    }
                    return acc
                }, {} as Record<string, WebdriverIO.Browser>)

                if (Object.keys(newMultiRemote.instances).length === 0) {
                    throw new Error('None of the following requested instances are valid: ' + instanceNames.join(', '))
                }

                return newMultiRemote.modifier(this)
            },
            configurable: true,
            writable: true
        }

        for (const commandName of wrapperClient.commandList) {
            // Preserved overridden commands
            if (enableMultiRemoteSelect && !Object.prototype.hasOwnProperty.call(wrapperClient, commandName) && overridableCommands.has(commandName)) {
                delete propertiesObject[commandName]
                continue
            }

            if (enableMultiRemoteSelect) {
            // Wrap commands only that are functions else it breaks the interface type
                const isFunction = typeof wrapperClient[commandName] === 'function'
                propertiesObject[commandName] = {
                    value: isFunction ? this.commandWrapper(commandName) : wrapperClient[commandName],
                    configurable: true
                }
            } else {
                propertiesObject[commandName] = {
                    value: this.commandWrapper(commandName),
                    configurable: true
                }
            }
        }

        propertiesObject.__propertiesObject__ = {
            value: propertiesObject
        }

        this.baseInstance = new MultiRemoteDriver(this.instances, propertiesObject)
        const client = Object.create(this.baseInstance, propertiesObject)

        // Preserve addLocatorStrategy if it exists on the wrapper client
        if (enableMultiRemoteSelect && Object.prototype.hasOwnProperty.call(wrapperClient, 'addLocatorStrategy')) {
            client.addLocatorStrategy = addLocatorStrategyHandler(client)
        }
        /**
         * attach instances to wrapper client
         * ToDo(Christian): deprecate and remove
         */
        for (const [identifier, instance] of Object.entries(this.instances)) {
            client[identifier] = instance
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
        // TODO: One day let's change for a Map<string, WebdriverIO.Browser> to preserve the order of the instances
        instances: Record<string, WebdriverIO.Browser>,
        result: unknown,
        propertiesObject: Record<string, PropertyDescriptor>,
        scope: MultiRemote,
        selector?: string,
    ): WebdriverIO.MultiRemoteElement {
        const prototype = { ...propertiesObject, ...clone(getPrototype('element')), scope: { value: 'element' } }

        const element = webdriverMonad({}, (client: WebdriverIO.MultiRemoteElement) => {
            /**
             * attach instances to wrapper client
             */
            for (const [i, identifier] of Object.entries(Object.keys(instances))) {
                // @ts-expect-error ToDo(Christian): deprecate
                client[identifier] = result[i]
            }

            client.instances = Object.keys(instances)
            client.isMultiremote = true
            client.selector = selector ?? (Array.isArray(result) && result[0]
                ? result[0].selector
                : null)
            // @ts-expect-error ToDo(Christian): remove eventually
            delete client.sessionId

            client.unstable_select = function unstableSelect(...instanceNames: string[]) {
                const selectedResults: unknown[] = []

                const selectedInstances = instanceNames.reduce((acc, name) => {
                    if (client.instances.includes(name)) {
                        acc[name] = scope.instances[name]
                        // @ts-expect-error
                        const element: WebdriverIO.Element = client[name]
                        selectedResults.push(element)
                    }
                    // Skipping instances that are not part of the current multi-remote setup
                    return acc
                }, {} as Record<string, WebdriverIO.Browser>)

                if (Object.keys(selectedInstances).length === 0) {
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

        // This redefines the command when chaining with for example `$()` else it uses `propertiesObject.getInstance` by default
        if (commandName === 'getInstance') {
            return function commandWrapperGetInstance(this: Record<string, WebdriverIO.Browser | WebdriverIO.Element>, browserName: string) {
                if (!this[browserName]) {
                    throw new Error(`Multiremote object has no instance named "${browserName}"`)
                }
                return this[browserName]
            }
        }

        return wrapCommand(commandName, async function (this: WebdriverIO.MultiRemoteBrowser | WebdriverIO.MultiRemoteElement, ...args: unknown[]) {
            const thisElement = this as WebdriverIO.MultiRemoteElement
            const isElementScope = thisElement.selector
            const scopeEntries = isElementScope
                ? Object.entries(thisElement.instances.reduce((instance, instanceName) => (
                    // @ts-expect-error ToDo(Christian): deprecate
                    { ...instance, [instanceName]: thisElement[instanceName] }
                ), {} as Record<string, Element[]>))
                : Object.entries(instances)

            const result = await Promise.all(
                scopeEntries.map(
                    ([, instance]) => instance[commandName](...args)
                )
            )

            // Narrow instances to only those actually used in this command call
            const activeInstances = isElementScope && process.env.WDIO_ENABLE_MULTI_REMOTE_SELECT === 'true'
                ? thisElement.instances.reduce((instance, instanceName) => (
                    { ...instance, [instanceName]: instances[instanceName] }
                ), {} as Record<string, WebdriverIO.Browser>)
                : instances

            /**
             * return element object to call commands directly
             */
            if (commandName === '$') {
                return MultiRemote.elementWrapper(activeInstances, result, this.__propertiesObject__, self)
            } else if (commandName === '$$') {
                const selector = args[0] as Selector
                const zippedResult = zip(...result)
                const wrappedResult = zippedResult.map((singleResult) => MultiRemote.elementWrapper(activeInstances, singleResult, this.__propertiesObject__, self, typeof selector === 'string' ? selector : undefined))

                // TODO remove this flag in v10
                if (process.env.WDIO_ENABLE_MULTI_REMOTE_ELEMENT_ARRAY !== 'true') {
                    return wrappedResult
                }

                // TODO in v10, let's do a proper MultiRemoteElementArray type instead of casting
                const elementArray = enhanceElementsArray(
                    wrappedResult as unknown as WebdriverIO.Element[],
                    this as unknown as WebdriverIO.Browser,
                    selector,
                    commandName
                )

                // TODO expose this property in v10 with a new MultiRemoteElementArray type
                Object.assign(elementArray, { isMultiremote: true })
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
    isMultiremote = true as const
    __propertiesObject__: Record<string, PropertyDescriptor>

    constructor (
        instances: Record<string, WebdriverIO.Browser>,
        propertiesObject: Record<string, PropertyDescriptor>
    ) {
        this.instances = Object.keys(instances)
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
