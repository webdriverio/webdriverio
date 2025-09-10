import { capabilitiesEnvironmentDetector } from '@wdio/utils'
import type { Capabilities } from '@wdio/types'

const NOOP = () => {}

/**
 * create `browser` object with capabilities and environment flags before session is started
 * so that Mocha/Jasmine users can filter their specs based on flags or use capabilities in test titles
 */
export default class ProtocolStub {
    static async newSession (options: Capabilities.RemoteConfig) {
        const capabilities = emulateSessionCapabilities(options.capabilities)

        const browser = {
            options,
            capabilities,
            requestedCapabilities: capabilities,
            customCommands: [] as unknown[], // internally used to transfer custom commands to the actual protocol instance
            overwrittenCommands: [] as unknown[], // internally used to transfer overwritten commands to the actual protocol instance
            commandList: [],
            getWindowHandle: NOOP,
            on: NOOP,
            off: NOOP,
            addCommand: NOOP,
            overwriteCommand: NOOP,
            ...capabilitiesEnvironmentDetector(capabilities)
        }

        browser.addCommand = (...args: unknown[]) => browser.customCommands.push(args)
        browser.overwriteCommand = (...args: unknown[]) => browser.overwrittenCommands.push(args)
        return browser as unknown as WebdriverIO.Browser
    }

    /**
     * added just in case user wants to somehow reload webdriver before it was started.
     */
    static reloadSession () {
        throw new Error('Protocol Stub: Make sure to start the session before reloading it.')
    }

    static attachToSession (options: never, modifier?: Function) {
        if (options || !modifier) {
            throw new Error('You are trying to attach to a protocol stub, this should never occur, please file an issue.')
        }

        /**
         * MultiRemote is needed
         */
        return modifier({
            commandList: []
        })
    }
}

/**
 * transform capabilities provided by user to look like
 * capabilities returned by WebDriver
 * @param   {object} caps user defined capabilities
 * @return  {object}
 */
function emulateSessionCapabilities (caps: Capabilities.RequestedStandaloneCapabilities) {
    const capabilities: Record<string, unknown> = {}

    // remove appium vendor prefix from capabilities
    Object.entries(caps).forEach(([key, value]) => {
        const newKey = key.replace('appium:', '')
        capabilities[newKey] = value
    })

    // isChrome
    const c = 'alwaysMatch' in caps ? caps.alwaysMatch : caps
    if (c.browserName && c.browserName.toLowerCase() === 'chrome') {
        capabilities['goog:chromeOptions'] = {}
    }

    return capabilities
}
