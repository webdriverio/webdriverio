import type { Browser } from 'webdriverio'
import type { JsonCompatible, JsonPrimitive, Services } from '@wdio/types'

import { BrowserExtension } from './index.js'
import { getValue, setValue, setPort } from './client.js'
import type { SharedStoreServiceCapabilities } from './types'

/**
 * ToDo(Christian): make this public accessible
 */
interface ServiceBrowser extends Browser<'async'>, BrowserExtension { }

export default class SharedStoreService implements Services.ServiceInstance {
    private _browser?: ServiceBrowser

    constructor(_: never, caps: SharedStoreServiceCapabilities) {
        setPort(caps['wdio:sharedStoreServicePort']!)
    }

    before (
        caps: never,
        specs: never,
        browser: ServiceBrowser
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
            }
        })

        this._browser.sharedStore = sharedStore
    }
}
