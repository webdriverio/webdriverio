import type { Automation, Capabilities } from '@wdio/types'

const NOT_IMPLEMENTED = '@wdio/mobilecli-driver does not implement this yet'

/**
 * Automation protocol driver that runs WebdriverIO commands through mobilecli.
 * WebdriverIO loads it when `automationProtocol` is `@wdio/mobilecli-driver`
 * and calls these static functions in place of the ones of `webdriver`.
 */
export default class MobilecliDriver {
    static async newSession (_options: Capabilities.RemoteConfig): Promise<never> {
        throw new Error(`newSession: ${NOT_IMPLEMENTED}`)
    }

    static attachToSession (): never {
        throw new Error(`attachToSession: ${NOT_IMPLEMENTED}`)
    }

    static async reloadSession (): Promise<never> {
        throw new Error(`reloadSession: ${NOT_IMPLEMENTED}`)
    }
}

/**
 * the type check that the class has the functions WebdriverIO calls
 */
MobilecliDriver satisfies Automation.Driver<Capabilities.RemoteConfig>
