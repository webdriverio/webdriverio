import type { Automation, Capabilities } from '@testplane/wdio-types'
import logger from '@testplane/wdio-logger'

import { isStub } from './index.js'
import ProtocolStub from '../protocol-stub.js'
import detectBackend from './detectBackend.js'
import { SupportedAutomationProtocols } from '../constants.js'

const log = logger('webdriverio')

interface ProtocolDriver {
    Driver: Automation.Driver<Capabilities.RemoteConfig>
    options: Capabilities.WebdriverIOConfig
}

let webdriverImport: Automation.Driver<Capabilities.RemoteConfig> | undefined

/**
 * get protocol driver
 * @param  {Capabilities.WebdriverIOConfig} options  remote options
 * @return {Automation.Driver}      automation driver
 */
export async function getProtocolDriver (options: Capabilities.WebdriverIOConfig): Promise<ProtocolDriver> {
    const { automationProtocol } = options
    /**
     * We still want to be able to inject a stub driver to avoid loading the actual
     * driver package in two places:
     *
     * - when initiating the Mocha or Jasmine framework and allow to us to evaluate
     *   whether tests are being executed in the worker before starting a session
     * - when running component tests where we don't need a driver at all
     */
    if (isStub(options.automationProtocol)) {
        return { Driver: ProtocolStub, options }
    }

    /**
     * update connection parameters if we are running in a cloud
     */
    if (typeof options.user === 'string' && typeof options.key === 'string') {
        Object.assign(options, detectBackend(options))
    }

    /**
     * return `devtools` if explicitly set
     */
    if (automationProtocol === SupportedAutomationProtocols.devtools || automationProtocol?.startsWith('/@fs/')) {
        try {
            const DevTools = await import(automationProtocol)
            log.info('Starting session using Chrome DevTools as automation protocol and Puppeteer as driver')
            return { Driver: DevTools.default, options }
        } catch (err: unknown) {
            throw new Error(
                `Failed to import "${automationProtocol}" as automation protocol driver!\n` +
                (automationProtocol === SupportedAutomationProtocols.devtools
                    ? 'Make sure to have it installed as dependency (`npm i devtools`)!\n'
                    : ''
                ) +
                `Error: ${(err as Error).message}`
            )
        }
    }

    const packageName = automationProtocol === 'webdriver' ? `@testplane/${automationProtocol}` : automationProtocol || '@testplane/wdio-webdriver'
    const Driver = webdriverImport || (await import(packageName)).default

    return { Driver, options }
}
