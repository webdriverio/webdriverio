import type { JsonPrimitive, JsonCompatible } from '@wdio/types'

import SharedStoreLauncher from './launcher.js'
import SharedStoreService from './service.js'

export { getValue, setValue } from './client.js'
export default SharedStoreService
export const launcher = SharedStoreLauncher

export interface BrowserExtension {
    sharedStore: {
        get: (key: string) => JsonPrimitive | JsonCompatible;
        set: (key: string, value: JsonPrimitive | JsonCompatible) => void;
    }
}

declare global {
    namespace WebdriverIOAsync {
        interface Browser extends BrowserExtension { }
        interface MultiRemoteBrowser extends BrowserExtension { }
    }

    namespace WebdriverIOSync {
        interface Browser extends BrowserExtension { }
        interface MultiRemoteBrowser extends BrowserExtension { }
    }
}
