import type { JsonPrimitive, JsonCompatible, JsonArray } from '@wdio/types'

import SharedStoreLauncher from './launcher.js'
import SharedStoreService from './service.js'
import type { GetValueOptions } from './types'

export { getValue, setValue, setResourcePool, getValueFromPool, addValueToPool } from './client.js'
export default SharedStoreService
export const launcher = SharedStoreLauncher

export interface BrowserExtension {
    sharedStore: {
        get: (key: string) => JsonPrimitive | JsonCompatible;
        set: (key: string, value: JsonPrimitive | JsonCompatible) => void;
        setResourcePool: (key: string, value: JsonArray) => void;
        getValueFromPool: (key: string, options: GetValueOptions) => JsonPrimitive | JsonCompatible;
        addValueToPool: (key: string, value: JsonPrimitive | JsonCompatible) => void;
    }
}

declare global {
    namespace WebdriverIO {
        interface Browser extends BrowserExtension { }
        interface MultiRemoteBrowser extends BrowserExtension { }
    }
}
