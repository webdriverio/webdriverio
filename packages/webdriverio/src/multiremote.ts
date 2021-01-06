import zip from 'lodash.zip'
import clone from 'lodash.clonedeep'
import { webdriverMonad, wrapCommand } from '@wdio/utils'

import { multiremoteHandler } from './middlewares'
import { getPrototype } from './utils'
import type { BrowserObject, RemoteOptions, MultiRemoteBrowserObject } from './types'

type EventEmitter = (args: any) => void

/**
 * Multiremote class
 */
export default class MultiRemote {
    instances: Record<string, BrowserObject> = {}
    baseInstance?: MultiRemoteDriver
    sessionId?: string

    /**
     * add instance to multibrowser instance
     */
    async addInstance (browserName: string, client: BrowserObject) {
        this.instances[browserName] = await client
        return this.instances[browserName]
    }

    /**
     * modifier for multibrowser instance
     */
    modifier (wrapperClient: { options: RemoteOptions, commandList: string[] }) {
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
        instances: Record<string, BrowserObject>,
        result: any,
        propertiesObject: Record<string, PropertyDescriptor>
    ) {
        const prototype = { ...propertiesObject, ...clone(getPrototype('element')), scope: { value: 'element' } }

        const element = webdriverMonad({}, (client: MultiRemoteBrowserObject) => {
            /**
             * attach instances to wrapper client
             */
            for (const [i, identifier] of Object.entries(Object.keys(instances))) {
                client[identifier] = result[i]
            }

            client.instances = Object.keys(instances)
            // @ts-ignore
            delete client.sessionId
            return client
        }, prototype)

        // @ts-ignore
        return element(this.sessionId, multiremoteHandler(wrapCommand))
    }

    /**
     * handle commands for multiremote instances
     */
    commandWrapper (commandName: string) {
        const instances = this.instances
        return wrapCommand(commandName, async function (this: BrowserObject, ...args: any[]) {
            const result = await Promise.all(
                // @ts-ignore
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

interface MultiRemoteClient {
    (instanceName: string): BrowserObject
}

/**
 * event listener class that propagates events to sub drivers
 */
/* istanbul ignore next */
export class MultiRemoteDriver implements Partial<MultiRemoteClient> {
    instances: string[]
    isMultiremote = true as true
    __propertiesObject__: Record<string, PropertyDescriptor>

    constructor (
        instances: Record<string, BrowserObject>,
        propertiesObject: Record<string, PropertyDescriptor>
    ) {
        this.instances = Object.keys(instances)
        this.__propertiesObject__ = propertiesObject
    }

    on (this: MultiRemoteBrowserObject, eventName: string, emitter: EventEmitter) {
        this.instances.forEach((instanceName) => this[instanceName].on(eventName, emitter))
        return undefined as any
    }

    once (this: MultiRemoteBrowserObject, eventName: string, emitter: EventEmitter) {
        this.instances.forEach((instanceName) => this[instanceName].once(eventName, emitter))
        return undefined as any
    }

    emit (this: MultiRemoteBrowserObject, eventName: string, emitter: EventEmitter) {
        return this.instances.map(
            (instanceName) => this[instanceName].emit(eventName, emitter)
        ).some(Boolean)
    }

    eventNames (this: MultiRemoteBrowserObject) {
        return this.instances.map(
            (instanceName) => this[instanceName].eventNames()
        ) as any // special behavior of event methods for multiremote
    }

    getMaxListeners (this: MultiRemoteBrowserObject) {
        return this.instances.map(
            (instanceName) => this[instanceName].getMaxListeners()
        ) as any as number // special behavior of event methods for multiremote
    }

    listenerCount (this: MultiRemoteBrowserObject, eventName: string) {
        return this.instances.map(
            (instanceName) => this[instanceName].listenerCount(eventName)
        ) as any as number // special behavior of event methods for multiremote
    }

    listeners (this: MultiRemoteBrowserObject, eventName: string) {
        return this.instances.map(
            (instanceName) => this[instanceName].listeners(eventName)
        ).reduce((prev, cur) => {
            prev.concat(cur)
            return prev
        }, [])
    }

    removeListener (this: MultiRemoteBrowserObject, eventName: string, emitter: EventEmitter) {
        this.instances.forEach((instanceName) => this[instanceName].removeListener(eventName, emitter))
        return undefined as any
    }

    removeAllListeners (this: MultiRemoteBrowserObject, eventName: string) {
        this.instances.forEach((instanceName) => this[instanceName].removeAllListeners(eventName))
        return undefined as any
    }
}
