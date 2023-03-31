import type { DesiredCapabilities } from './Capabilities.js'

export interface Multiremote {
    sessionId?: string
    capabilities: DesiredCapabilities
}

export interface Browser {}
