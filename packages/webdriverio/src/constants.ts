import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'

import { HOOK_DEFINITION } from '@wdio/utils'
import type { Options, Capabilities } from '@wdio/types'

export enum SupportedAutomationProtocols {
    webdriver = 'webdriver',
    devtools = 'devtools',
    stub = './protocol-stub.js'
}

export const ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf'
export const SHADOW_ELEMENT_KEY = 'shadow-6066-11e4-a52e-4f735466cecf'

export const WDIO_DEFAULTS: Options.Definition<Options.WebdriverIO> = {
    /**
     * allows to specify automation protocol
     */
    automationProtocol: {
        type: 'string',
        default: SupportedAutomationProtocols.webdriver,
        validate: (param: Options.SupportedProtocols) => {
            /**
             * path when proxy is used for browser testing
             */
            if (param.endsWith('driver.js')) {
                return
            }

            if (!Object.values(SupportedAutomationProtocols).includes(param.toLowerCase() as SupportedAutomationProtocols)) {
                throw new Error(`Currently only "webdriver" and "devtools" is supported as automationProtocol, you set "${param}"`)
            }

            try {
                const __dirname = dirname(fileURLToPath(import.meta.url))
                const require = createRequire(import.meta.url)
                const id = param === SupportedAutomationProtocols.stub
                    ? resolve(__dirname, '..', 'build', param)
                    : param
                require.resolve(id)
            } catch (err: any) {
                /* istanbul ignore next */
                throw new Error(
                    'Automation protocol package is not installed!\n' +
                    `Please install it via \`npm install ${param}\``
                )
            }
        }
    },
    /**
     * capabilities of WebDriver sessions
     */
    capabilities: {
        type: 'object',
        validate: (param: Capabilities.RemoteCapability) => {
            /**
             * should be an object
             */
            if (typeof param === 'object') {
                return true
            }

            throw new Error('the "capabilities" options needs to be an object or a list of objects')
        },
        required: true
    },
    /**
     * Shorten navigateTo command calls by setting a base url
     */
    baseUrl: {
        type: 'string'
    },
    /**
     * Default interval for all waitFor* commands
     */
    waitforInterval: {
        type: 'number',
        default: 500
    },
    /**
     * Default timeout for all waitFor* commands
     */
    waitforTimeout: {
        type: 'number',
        default: 5000
    },
    /**
     * Hooks
     */
    onReload: HOOK_DEFINITION,
    beforeCommand: HOOK_DEFINITION,
    afterCommand: HOOK_DEFINITION
}

export const W3C_SELECTOR_STRATEGIES = ['css selector', 'link text', 'partial link text', 'tag name', 'xpath']

export const DRIVER_DEFAULT_ENDPOINT = {
    method: 'GET',
    host: 'localhost',
    port: 4444,
    path: '/status'
}

export const FF_REMOTE_DEBUG_ARG = '-remote-debugging-port'
export const DEEP_SELECTOR = '>>>'
export const ARIA_SELECTOR = 'aria/'

export const ERROR_REASON = [
    'Failed', 'Aborted', 'TimedOut', 'AccessDenied', 'ConnectionClosed',
    'ConnectionReset', 'ConnectionRefused', 'ConnectionAborted',
    'ConnectionFailed', 'NameNotResolved', 'InternetDisconnected',
    'AddressUnreachable', 'BlockedByClient', 'BlockedByResponse'
]

/**
 * Special Characters
 */
export { UNICODE_CHARACTERS as Key } from '@wdio/utils'