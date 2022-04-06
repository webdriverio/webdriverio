import { Capabilities } from '@wdio/types'

export interface SharedStoreServiceCapabilities extends Capabilities.Capabilities {
    'wdio:sharedStoreServicePort': string
}