import type { JsonPrimitive, JsonCompatible } from '@wdio/types'

import SharedStoreLauncher from './launcher'
import SharedStoreService from './service'

export default SharedStoreService
export const launcher = SharedStoreLauncher

export declare namespace WebdriverIO {
    interface Browser {
        sharedStore: {
            get: (key: string) => JsonPrimitive | JsonCompatible;
            set: (key: string, value: JsonPrimitive | JsonCompatible) => void;
        }
    }
}
