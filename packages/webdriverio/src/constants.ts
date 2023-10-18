import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'

import { UNICODE_CHARACTERS, HOOK_DEFINITION } from '@wdio/utils'
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
export const Key = {
    /**
     * Special control key that works cross browser for Mac, where it's the command key, and for
     * Windows or Linux, where it is the control key.
     */
    Ctrl: 'WDIO_CONTROL',
    NULL: UNICODE_CHARACTERS.NULL,
    Cancel: UNICODE_CHARACTERS.Cancel,
    Help: UNICODE_CHARACTERS.Help,
    Backspace: UNICODE_CHARACTERS.Backspace,
    Tab: UNICODE_CHARACTERS.Tab,
    Clear: UNICODE_CHARACTERS.Clear,
    Return: UNICODE_CHARACTERS.Return,
    Enter: UNICODE_CHARACTERS.Enter,
    Shift: UNICODE_CHARACTERS.Shift,
    Control: UNICODE_CHARACTERS.Control,
    Alt: UNICODE_CHARACTERS.Alt,
    Pause: UNICODE_CHARACTERS.Pause,
    Escape: UNICODE_CHARACTERS.Escape,
    Space: UNICODE_CHARACTERS.Space,
    PageUp: UNICODE_CHARACTERS.PageUp,
    PageDown: UNICODE_CHARACTERS.PageDown,
    End: UNICODE_CHARACTERS.End,
    Home: UNICODE_CHARACTERS.Home,
    ArrowLeft: UNICODE_CHARACTERS.ArrowLeft,
    ArrowUp: UNICODE_CHARACTERS.ArrowUp,
    ArrowRight: UNICODE_CHARACTERS.ArrowRight,
    ArrowDown: UNICODE_CHARACTERS.ArrowDown,
    Insert: UNICODE_CHARACTERS.Insert,
    Delete: UNICODE_CHARACTERS.Delete,
    Semicolon: UNICODE_CHARACTERS.Semicolon,
    Equals: UNICODE_CHARACTERS.Equals,
    Numpad0: UNICODE_CHARACTERS['Numpad 0'],
    Numpad1: UNICODE_CHARACTERS['Numpad 1'],
    Numpad2: UNICODE_CHARACTERS['Numpad 2'],
    Numpad3: UNICODE_CHARACTERS['Numpad 3'],
    Numpad4: UNICODE_CHARACTERS['Numpad 4'],
    Numpad5: UNICODE_CHARACTERS['Numpad 5'],
    Numpad6: UNICODE_CHARACTERS['Numpad 6'],
    Numpad7: UNICODE_CHARACTERS['Numpad 7'],
    Numpad8: UNICODE_CHARACTERS['Numpad 8'],
    Numpad9: UNICODE_CHARACTERS['Numpad 9'],
    Multiply: UNICODE_CHARACTERS.Multiply,
    Add: UNICODE_CHARACTERS.Add,
    Separator: UNICODE_CHARACTERS.Separator,
    Subtract: UNICODE_CHARACTERS.Subtract,
    Decimal: UNICODE_CHARACTERS.Decimal,
    Divide: UNICODE_CHARACTERS.Divide,
    F1: UNICODE_CHARACTERS.F1,
    F2: UNICODE_CHARACTERS.F2,
    F3: UNICODE_CHARACTERS.F3,
    F4: UNICODE_CHARACTERS.F4,
    F5: UNICODE_CHARACTERS.F5,
    F6: UNICODE_CHARACTERS.F6,
    F7: UNICODE_CHARACTERS.F7,
    F8: UNICODE_CHARACTERS.F8,
    F9: UNICODE_CHARACTERS.F9,
    F10: UNICODE_CHARACTERS.F10,
    F11: UNICODE_CHARACTERS.F11,
    F12: UNICODE_CHARACTERS.F12,
    Command: UNICODE_CHARACTERS.Command,
    ZenkakuHankaku: UNICODE_CHARACTERS.ZenkakuHankaku
} as const
