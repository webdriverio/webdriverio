import type { Capabilities } from '@wdio/types'

export interface SharedStoreServiceCapabilities extends Capabilities.Capabilities {
    'wdio:sharedStoreServicePort': number
}