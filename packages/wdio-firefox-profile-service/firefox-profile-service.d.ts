import type { Options } from './build/types'

declare module WebdriverIO {
    interface ServiceOption extends Options {}
}
