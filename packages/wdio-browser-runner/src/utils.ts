import { deepmerge } from 'deepmerge-ts'
import logger from '@wdio/logger'
import type { Capabilities } from '@wdio/types'
import type { BrowserRunnerOptions } from './types'

const log = logger('@wdio/browser-runner')

export function makeHeadless (options: BrowserRunnerOptions, caps: Capabilities.RemoteCapability): Capabilities.RemoteCapability {
    const capability = (caps as Capabilities.W3CCapabilities).alwaysMatch || caps
    if (!capability.browserName) {
        throw new Error(
            'No "browserName" defined in capability object. It seems you are trying to run tests ' +
            'in a non web environment, however WebdriverIOs browser runner only supports web environments'
        )
    }

    if ((typeof options.headless === 'boolean' && !options.headless) || !process.env.CI) {
        return caps
    }

    if (capability.browserName === 'chrome') {
        return deepmerge(capability, {
            'goog:chromeOptions': {
                args: ['headless', 'disable-gpu']
            }
        })
    } else if (capability.browserName === 'firefox') {
        return deepmerge(capability, {
            'moz:firefoxOptions': {
                args: ['-headless']
            }
        })
    } else if (capability.browserName === 'msedge') {
        return deepmerge(capability, {
            'ms:edgeOptions': {
                args: ['--headless']
            }
        })
    }

    log.error(`Headless mode not supported for browser "${capability.browserName}"`)
    return caps
}
