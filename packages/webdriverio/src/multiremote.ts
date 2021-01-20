import zip from 'lodash.zip'
import clone from 'lodash.clonedeep'
import { webdriverMonad, wrapCommand } from '@wdio/utils'
import type { Options } from '@wdio/types'
import type { ProtocolCommands } from '@wdio/protocols'

import { multiremoteHandler } from './middlewares'
import { getPrototype } from './utils'
import type { BrowserCommandsType } from './types'

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
    modifier (wrapperClient: { options: Options.WebdriverIO, commandList: (keyof (ProtocolCommands & BrowserCommandsType))[] }) {
        const propertiesObject: Record<string, PropertyDescriptor> = {}
        propertiesObject.commandList = { value: wrapperClient.commandList }
        propertiesObject.options = { value: wrapperClient.options }

        for (const commandName of wrapperClient.commandList) {
            propertiesObject[commandName] = {
                value: this.commandWrapper(commandName),
                configurable: true
            }
        }

        propertiesObject['__propertiesObject__'] = {
            value: propertiesObject
        }

        this.baseInstance = new MultiRemoteDriver(this.instances, propertiesObject)
        const client = Object.create(this.baseInstance, propertiesObject)

        /**
         * attach instances to wrapper client
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
        propertiesObject: Record<string, PropertyDescriptor>
    ) {
        const prototype = { ...propertiesObject, ...clone(getPrototype('element')), scope: { value: 'element' } }

        const element = webdriverMonad({}, (client: WebdriverIO.MultiRemoteBrowser) => {
            /**
             * attach instances to wrapper client
             */
            for (const [i, identifier] of Object.entries(Object.keys(instances))) {
                client[identifier] = result[i]
            }

            client.instances = Object.keys(instances)
            delete client.sessionId
            return client
        }, prototype)

        // @ts-ignore
        return element(this.sessionId, multiremoteHandler(wrapCommand))
    }

    /**
     * handle commands for multiremote instances
     */
    commandWrapper (commandName: keyof (ProtocolCommands & BrowserCommandsType)) {
        const instances = this.instances
        return wrapCommand(commandName, async function (this: WebdriverIO.Browser, ...args: any[]) {
            const result = await Promise.all(
                // @ts-expect-error
                Object.entries(instances).map(([, instance]) => instance[commandName](...args))
            )

            /**
             * return element object to call commands directly
             */
            if (commandName === '$') {
                return MultiRemote.elementWrapper(instances, result, this.__propertiesObject__)
            } else if (commandName === '$$') {
                const zippedResult = zip(...result)
                return zippedResult.map((singleResult) => MultiRemote.elementWrapper(instances, singleResult, this.__propertiesObject__))
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
        this.instances.forEach((instanceName) => this[instanceName].on(eventName, emitter))
        return undefined as any
    }

    once (this: WebdriverIO.MultiRemoteBrowser, eventName: string, emitter: EventEmitter) {
        this.instances.forEach((instanceName) => this[instanceName].once(eventName, emitter))
        return undefined as any
    }

    emit (this: WebdriverIO.MultiRemoteBrowser, eventName: string, emitter: EventEmitter) {
        return this.instances.map(
            (instanceName) => this[instanceName].emit(eventName, emitter)
        ).some(Boolean)
    }

    eventNames (this: WebdriverIO.MultiRemoteBrowser) {
        return this.instances.map(
            (instanceName) => this[instanceName].eventNames()
        ) as any // special behavior of event methods for multiremote
    }

    getMaxListeners (this: WebdriverIO.MultiRemoteBrowser) {
        return this.instances.map(
            (instanceName) => this[instanceName].getMaxListeners()
        ) as any as number // special behavior of event methods for multiremote
    }

    listenerCount (this: WebdriverIO.MultiRemoteBrowser, eventName: string) {
        return this.instances.map(
            (instanceName) => this[instanceName].listenerCount(eventName)
        ) as any as number // special behavior of event methods for multiremote
    }

    listeners (this: WebdriverIO.MultiRemoteBrowser, eventName: string) {
        return this.instances.map(
            (instanceName) => this[instanceName].listeners(eventName)
        ).reduce((prev, cur) => {
            prev.concat(cur)
            return prev
        }, [])
    }

    removeListener (this: WebdriverIO.MultiRemoteBrowser, eventName: string, emitter: EventEmitter) {
        this.instances.forEach((instanceName) => this[instanceName].removeListener(eventName, emitter))
        return undefined as any
    }

    removeAllListeners (this: WebdriverIO.MultiRemoteBrowser, eventName: string) {
        this.instances.forEach((instanceName) => this[instanceName].removeAllListeners(eventName))
        return undefined as any
    }
}
