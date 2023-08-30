import type { JsonCompatible, JsonPrimitive, Services, JsonArray } from '@wdio/types'

import { getValue, setValue, setPort, setResourcePool, getValueFromPool, addValueToPool } from './client.js'
import type { SharedStoreServiceCapabilities } from './types.js'
import type { GetValueOptions } from './types'

export default class SharedStoreService implements Services.ServiceInstance {
    private _browser?: WebdriverIO.Browser

    constructor(_: never, caps: SharedStoreServiceCapabilities) {
        setPort(caps['wdio:sharedStoreServicePort']!)
    }

    before (
        caps: never,
        specs: never,
        browser: WebdriverIO.Browser
    ) {
        this._browser = browser
        const sharedStore = Object.create({}, {
            get: {
                value: (key: string) => this._browser?.call(() => getValue(key))
            },
            set: {
                value: (
                    key: string,
                    value: JsonCompatible | JsonPrimitive
                ) => this._browser?.call(() => setValue(key, value))
            },
            setResourcePool: {
                value: (
                    key: string,
                    value: JsonArray
                ) => this._browser?.call(() => setResourcePool(key, value))
            },
            getValueFromPool: {
                value: (
                    key: string,
                    options: GetValueOptions
                ) => this._browser?.call(() => getValueFromPool(key, options))
            },
            addValueToPool: {
                value: (
                    key: string,
                    value: JsonCompatible | JsonPrimitive
                ) => this._browser?.call(() => addValueToPool(key, value))
            }
        })

        this._browser.sharedStore = sharedStore
    }
}
