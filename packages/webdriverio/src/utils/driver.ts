import WebDriver from 'webdriver'
import logger from '@wdio/logger'

import ProtocolStub from '../protocol-stub.js'
import detectBackend from './detectBackend.js'
import { SupportedAutomationProtocols } from '../constants.js'
import type { RemoteOptions } from '../types.js'

const log = logger('webdriverio')

export async function getProtocolDriver (options: RemoteOptions) {
    if (options.automationProtocol === SupportedAutomationProtocols.stub) {
        return { Driver: ProtocolStub, options }
    }

    /**
     * return `devtools` if explicitly set
     */
    if (options.automationProtocol === SupportedAutomationProtocols.devtools) {
        try {
            const DevTools = await import('devtools')
            log.info('Starting session using Chrome DevTools as automation protocol and Puppeteer as driver')
            return { Driver: DevTools.default, options }
        } catch (err: unknown) {
            throw new Error(
                'Failed to import "devtools" as automation protocol driver!\n' +
                'Make sure to have it installed as dependency (`npm i devtools`)!\n' +
                `Error: ${(err as Error).message}`
            )
        }
    }

    if (options.automationProtocol === SupportedAutomationProtocols.webdriver) {
        /**
         * update connection parameters if we are running in a cloud
         */
        if (typeof options.user === 'string' && typeof options.key === 'string') {
            Object.assign(options, detectBackend(options))
        }

        return { Driver: WebDriver, options }
    }

    throw new Error(`Undefined or unsupported automation protocol "${options.automationProtocol}"`)
}
