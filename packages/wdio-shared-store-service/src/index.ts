import type { JsonPrimitive, JsonCompatible } from '@wdio/types'

import SharedStoreLauncher from './launcher'
import SharedStoreService from './service'

export default SharedStoreService
export const launcher = SharedStoreLauncher

declare global {
    namespace WebdriverIO {
        interface SharedStore {
            get: (key: string) => JsonPrimitive | JsonCompatible;
            set: (key: string, value: JsonPrimitive | JsonCompatible) => void;
        }

        interface Browser {
            sharedStore: SharedStore
        }

        interface MultiRemoteBrowser {
            sharedStore: SharedStore
        }
    }
}
