import type { JsonPrimitive, JsonCompatible } from '@wdio/types'

import SharedStoreLauncher from './launcher'
import SharedStoreService from './service'

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
