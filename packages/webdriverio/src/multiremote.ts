import zip from 'lodash.zip'
import clone from 'lodash.clonedeep'
import { webdriverMonad, wrapCommand } from '@wdio/utils'
import type { Options } from '@wdio/types'
import type { ProtocolCommands } from '@wdio/protocols'

import { multiremoteHandler } from './middlewares.js'
import { getPrototype } from './utils/index.js'
import type { BrowserCommandsType } from './types.js'

type EventEmitter = (args: any) => void

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
    async addInstance (browserName: string, client: any) {
        this.instances[browserName] = await client as WebdriverIO.Browser
        return this.instances[browserName]
    }

    /**
     * modifier for multibrowser instance
     */
    modifier (wrapperClient: { options: Options.WebdriverIO, commandList: (keyof (ProtocolCommands & BrowserCommandsType) & 'getInstance')[] }) {
        const propertiesObject: Record<string, PropertyDescriptor> = {}
        propertiesObject.commandList = { value: wrapperClient.commandList }
        propertiesObject.options = { value: wrapperClient.options }
        propertiesObject.getInstance = {
            value: (browserName: string) => this.instances[browserName]
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
        result: any,
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
            client.selector = result[0] ? result[0].selector : null
            // @ts-expect-error ToDo(Christian): remove eventually
            delete client.sessionId
            return client
        }, prototype)

        // @ts-ignore
        return element(this.sessionId, multiremoteHandler(scope.commandWrapper.bind(scope)))
    }

    /**
     * handle commands for multiremote instances
     */
    commandWrapper (commandName: keyof (ProtocolCommands & BrowserCommandsType) & 'getInstance') {
        const instances = this.instances
        const self = this

        if (commandName === 'getInstance') {
            return function (this: Record<string, WebdriverIO.Browser | WebdriverIO.Element>, browserName: string) {
                if (!this[browserName]) {
                    throw new Error(`Multiremote object has no instance named "${browserName}"`)
                }
                return this[browserName]
            }
        }

        return wrapCommand(commandName, async function (this: WebdriverIO.MultiRemoteBrowser | WebdriverIO.MultiRemoteElement, ...args: any[]) {
            const mElem = this as WebdriverIO.MultiRemoteElement
            const scope = (this as WebdriverIO.MultiRemoteElement).selector
                ? Object.entries(mElem.instances.reduce((ins, instanceName) => (
                    // @ts-expect-error ToDo(Christian): deprecate
                    { ...ins, [instanceName]: mElem[instanceName] }
                ), {} as Record<string, Element[]>))
                : Object.entries(instances)

            const result = await Promise.all(
                scope.map(
                    ([, instance]) => instance[commandName](...args)
                )
            )

            /**
             * return element object to call commands directly
             */
            if (commandName === '$') {
                const elem = MultiRemote.elementWrapper(instances, result, this.__propertiesObject__, self)
                return elem
            } else if (commandName === '$$') {
                const zippedResult = zip(...result)
                return zippedResult.map((singleResult) => MultiRemote.elementWrapper(instances, singleResult, this.__propertiesObject__, self))
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
    isMultiremote = true as true
    __propertiesObject__: Record<string, PropertyDescriptor>

    constructor (
        instances: Record<string, WebdriverIO.Browser>,
        propertiesObject: Record<string, PropertyDescriptor>
    ) {
        this.instances = Object.keys(instances)
        this.__propertiesObject__ = propertiesObject
    }

    on (this: WebdriverIO.MultiRemoteBrowser, eventName: string, emitter: EventEmitter) {
        this.instances.forEach((instanceName) => this.getInstance(instanceName).on(eventName, emitter))
        return undefined as any
    }

    once (this: WebdriverIO.MultiRemoteBrowser, eventName: string, emitter: EventEmitter) {
        this.instances.forEach((instanceName) => this.getInstance(instanceName).once(eventName, emitter))
        return undefined as any
    }

    emit (this: WebdriverIO.MultiRemoteBrowser, eventName: string, emitter: EventEmitter) {
        return this.instances.map(
            (instanceName) => this.getInstance(instanceName).emit(eventName, emitter)
        ).some(Boolean)
    }

    eventNames (this: WebdriverIO.MultiRemoteBrowser) {
        return this.instances.map(
            (instanceName) => this.getInstance(instanceName).eventNames()
        ) as any // special behavior of event methods for multiremote
    }

    getMaxListeners (this: WebdriverIO.MultiRemoteBrowser) {
        return this.instances.map(
            (instanceName) => this.getInstance(instanceName).getMaxListeners()
        ) as any as number // special behavior of event methods for multiremote
    }

    listenerCount (this: WebdriverIO.MultiRemoteBrowser, eventName: string) {
        return this.instances.map(
            (instanceName) => this.getInstance(instanceName).listenerCount(eventName)
        ) as any as number // special behavior of event methods for multiremote
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
        return undefined as any
    }

    removeAllListeners (this: WebdriverIO.MultiRemoteBrowser, eventName: string) {
        this.instances.forEach((instanceName) => this.getInstance(instanceName).removeAllListeners(eventName))
        return undefined as any
    }
}
