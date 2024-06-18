import type { Automation, Capabilities } from '@wdio/types'

import ProtocolStub from '../protocol-stub.js'
import detectBackend from './detectBackend.js'
import { SupportedAutomationProtocols } from '../constants.js'

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
    /**
     * We still want to be able to inject a stub driver to avoid loading the actual
     * driver package in two places:
     *
     * - when initiating the Mocha or Jasmine framework and allow to us to evaluate
     *   whether tests are being executed in the worker before starting a session
     * - when running component tests where we don't need a driver at all
     */
    if (options.automationProtocol === SupportedAutomationProtocols.stub) {
        return { Driver: ProtocolStub, options }
    }

    /**
     * update connection parameters if we are running in a cloud
     */
    if (typeof options.user === 'string' && typeof options.key === 'string') {
        Object.assign(options, detectBackend(options))
    }

    const Driver = webdriverImport || (await import(options.automationProtocol || 'webdriver')).default
    return { Driver, options }
}
