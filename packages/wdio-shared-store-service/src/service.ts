import type { JsonCompatible, JsonPrimitive, Services, JsonArray, Capabilities } from '@wdio/types'

import { getValue, setValue, setPort, setResourcePool, getValueFromPool, addValueToPool } from './client.js'
import { CUSTOM_CAP } from './constants.js'
import type { SharedStoreServiceCapabilities } from './types.js'
import type { GetValueOptions } from './types.js'

export default class SharedStoreService implements Services.ServiceInstance {
    private _browser?: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser

    constructor(_: never, caps: Capabilities.RemoteCapability) {
        const port = (
            (caps as SharedStoreServiceCapabilities)[CUSTOM_CAP] ||
            ((caps as Capabilities.W3CCapabilities).alwaysMatch as SharedStoreServiceCapabilities)?.[CUSTOM_CAP] ||
            (Object.values(caps as Capabilities.MultiRemoteCapabilities)[0]?.capabilities as SharedStoreServiceCapabilities)[CUSTOM_CAP]
        )

        if (!port) {
            throw new Error('SharedStoreService: port not found in capabilities')
        }

        setPort(port)
    }

    before (
        caps: never,
        specs: never,
        _browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    ) {
        this._browser = _browser
        const sharedStore = Object.create({}, {
            get: {
                value: (key: string) => getValue(key)
            },
            set: {
                value: (
                    key: string,
                    value: JsonCompatible | JsonPrimitive
                ) => setValue(key, value)
            },
            setResourcePool: {
                value: (
                    key: string,
                    value: JsonArray
                ) => setResourcePool(key, value)
            },
            getValueFromPool: {
                value: (
                    key: string,
                    options: GetValueOptions
                ) => getValueFromPool(key, options)
            },
            addValueToPool: {
                value: (
                    key: string,
                    value: JsonCompatible | JsonPrimitive
                ) => addValueToPool(key, value)
            }
        })

        this._browser.sharedStore = sharedStore
        const browser = this._browser as WebdriverIO.MultiRemoteBrowser
        if (!this._browser.capabilities && browser.instances) {

            browser.instances.forEach((browserName) => {
                browser.getInstance(browserName).sharedStore = sharedStore
            })
        }
    }
}
