import type { JsonCompatible, JsonPrimitive, Services, JsonArray, Capabilities } from '@wdio/types'

import * as SharedStoreClient from './client.js'
import { CUSTOM_CAP } from './constants.js'
import type { SharedStoreServiceCapabilities } from './types.js'
import type { GetValueOptions, SharedStoreOptions } from './types.js'
import { RequestError } from 'got'

const { getValue, setValue, setPort, setResourcePool, getValueFromPool, addValueToPool, close } = SharedStoreClient

export default class SharedStoreService implements Services.ServiceInstance {
    private _browser?: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    private _options?: SharedStoreOptions

    constructor(options: SharedStoreOptions, caps: Capabilities.RemoteCapability) {

        this._options = options ?? {}

        this._options.port = this._options.port ?? (
            (caps as SharedStoreServiceCapabilities)[CUSTOM_CAP] ||
            ((caps as Capabilities.W3CCapabilities).alwaysMatch as SharedStoreServiceCapabilities)?.[CUSTOM_CAP] ||
            (Object.values(caps as Capabilities.MultiRemoteCapabilities)[0]?.capabilities as SharedStoreServiceCapabilities)[CUSTOM_CAP]
        )

        if (!this._options.port) {
            throw new Error('SharedStoreService: port not found in capabilities')
        }

        setPort(this._options.port)
    }

    async safeguard500(error: any) {
        if (this._options?.ignore500 &&
            error instanceof RequestError &&
            error.response?.statusCode === 500) {
            return
        }
        throw error
    }

    before(
        caps: never,
        specs: never,
        _browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    ) {
        this._browser = _browser
        const sharedStore = Object.create({}, {
            get: {
                value: (key: string) => getValue(key)?.catch(this.safeguard500)
            },
            set: {
                value: (
                    key: string,
                    value: JsonCompatible | JsonPrimitive
                ) => setValue(key, value)?.catch(this.safeguard500)
            },
            setResourcePool: {
                value: (
                    key: string,
                    value: JsonArray
                ) => setResourcePool(key, value)?.catch(this.safeguard500)
            },
            getValueFromPool: {
                value: (
                    key: string,
                    options: GetValueOptions
                ) => getValueFromPool(key, options)?.catch(this.safeguard500)
            },
            addValueToPool: {
                value: (
                    key: string,
                    value: JsonCompatible | JsonPrimitive
                ) => addValueToPool(key, value)?.catch(this.safeguard500)
            },
            close: {
                value: () => close()
            }
        })

        this._browser.sharedStore = sharedStore
        const multiRemoteBrowser = this._browser as WebdriverIO.MultiRemoteBrowser

        if (!this._browser.capabilities && multiRemoteBrowser.instances) {

            multiRemoteBrowser.instances.forEach((browserName) => {
                multiRemoteBrowser.getInstance(browserName).sharedStore = sharedStore
            })
        }
    }
}
