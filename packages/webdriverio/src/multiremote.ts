import zip from 'lodash.zip'
import clone from 'lodash.clonedeep'
import { webdriverMonad, wrapCommand } from '@wdio/utils'
import type { Options } from '@wdio/types'
import type { ProtocolCommands } from '@wdio/protocols'

import { multiremoteHandler } from './middlewares.js'
import { getPrototype } from './utils/index.js'
import type { BrowserCommandsType, WebdriverIOEventMap } from './types.js'

type EventEmitter = (args: unknown) => void

/**
 * Multiremote class
 */
export default class MultiRemote {
    instances: Record<string, WebdriverIO.Browser> = {}
    baseInstance?: MultiRemoteDriver
    sessionId?: string
    usedUnstableSelectAPIOnElementScope = false

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
    modifier (wrapperClient: { options: Options.WebdriverIO, commandList: (keyof (ProtocolCommands & BrowserCommandsType) & 'getInstance' & 'unstable_select')[] }) {
        const propertiesObject: Record<string, PropertyDescriptor> = {}
        propertiesObject.commandList = { value: wrapperClient.commandList }
        propertiesObject.options = { value: wrapperClient.options }
        propertiesObject.getInstance = {
            value: (browserName: string) => this.instances[browserName]
        }

        propertiesObject.unstable_select = {
            value: (instanceNames: string | string[]) => {
                const names = Array.isArray(instanceNames) ? instanceNames : [instanceNames]
                const selectedInstances: Record<string, WebdriverIO.Browser> = {}
                names.forEach((name) => {
                    if (this.instances[name]) {
                        selectedInstances[name] = this.instances[name]
                    }
                })

                const newMultiRemote = new MultiRemote()
                newMultiRemote.instances = selectedInstances
                return newMultiRemote.modifier(wrapperClient)
            },
            configurable: true,
            writable: true
        }

        for (const commandName of wrapperClient.commandList) {
            propertiesObject[commandName] = {
                value: this.commandWrapper(commandName),
                configurable: true
            }
        }

        propertiesObject.__propertiesObject__ = {
            value: propertiesObject
        }

        this.baseInstance = new MultiRemoteDriver(this.instances, propertiesObject)
        const client = Object.create(this.baseInstance, propertiesObject)

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
        instances: Record<string, WebdriverIO.Browser>,
        result: unknown,
        propertiesObject: Record<string, PropertyDescriptor>,
        scope: MultiRemote
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
            client.selector = Array.isArray(result) && result[0]
                ? result[0].selector
                : null
            // @ts-expect-error ToDo(Christian): remove eventually
            delete client.sessionId

            client.unstable_select = function (instanceNames: string | string[]) {
                const selectedInstances: Record<string, WebdriverIO.Browser> = {}
                const selectedResults: unknown[] = []

                const instances = Array.isArray(instanceNames) ? instanceNames : [instanceNames]
                instances.forEach((name) => {
                    if (client.instances.includes(name)) {
                        selectedInstances[name] = scope.instances[name]
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        selectedResults.push((client as any)[name])
                    }
                })

                return MultiRemote.elementWrapper(selectedInstances, selectedResults, propertiesObject, scope)
            }

            client.unstable_filter = async function (predicate: (element: WebdriverIO.Element) => Promise<boolean> | boolean) {
                const selectedInstances: Record<string, WebdriverIO.Browser> = {}
                const selectedResults: unknown[] = []

                const results = await Promise.all(client.instances.map(async (instanceName) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const elem = (client as any)[instanceName]
                    const result = await predicate(elem)
                    return result ? { name: instanceName, elem } : null
                }))

                results.forEach((result) => {
                    if (result) {
                        selectedInstances[result.name] = scope.instances[result.name]
                        selectedResults.push(result.elem)
                    }
                })

                return MultiRemote.elementWrapper(selectedInstances, selectedResults, propertiesObject, scope)
            }

            return client
        }, prototype)

        // @ts-expect-error
        return element(this.sessionId, multiremoteHandler(scope.commandWrapper.bind(scope)))
    }

    /**
     * handle commands for multiremote instances
     */
    commandWrapper (commandName: keyof (ProtocolCommands & BrowserCommandsType) & 'getInstance' & 'unstable_select') {
        const instances = this.instances
        const self: MultiRemote = this

        if (commandName === 'getInstance') {
            return function (this: Record<string, WebdriverIO.Browser | WebdriverIO.Element>, browserName: string) {
                if (!this[browserName]) {
                    throw new Error(`Multiremote object has no instance named "${browserName}"`)
                }
                return this[browserName]
            }
        } else if (commandName === 'unstable_select') {
            self.usedUnstableSelectAPIOnElementScope = true
            return function (this: Record<string, WebdriverIO.Browser | WebdriverIO.Element>, instanceNames: string | string[]) {
                const names = Array.isArray(instanceNames) ? instanceNames : [instanceNames]

                if (!names.every((name) => this[name])) {
                    throw new Error(`Multiremote object has no instance named "${names.find((name) => !this[name])}"`)
                }

                const selectedInstances: Record<string, WebdriverIO.Browser> = {}
                names.forEach((name) => {
                    if (instances[name]) {
                        selectedInstances[name] = instances[name]
                    }
                })

                const newMultiRemote = new MultiRemote()
                newMultiRemote.instances = selectedInstances
                return newMultiRemote
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
            const activeInstances = isElementScope && self.usedUnstableSelectAPIOnElementScope
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
                const zippedResult = zip(...result)
                return zippedResult.map((singleResult) => MultiRemote.elementWrapper(activeInstances, singleResult, this.__propertiesObject__, self))
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
