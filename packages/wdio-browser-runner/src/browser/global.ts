import { automationProtocolPath } from 'virtual:wdio'
import { remote } from 'webdriverio'
import type { Capabilities } from '@wdio/types'

declare global {
    interface Window {
        __wdioSessionCapabilities__: Capabilities.RemoteCapability
        __wdioSessionId__: string,
        wdioDebugContinue: (value: unknown) => void
    }
}

export const browser = await remote({
    automationProtocol: automationProtocolPath as any,
    capabilities: window.__wdioSessionCapabilities__
})
