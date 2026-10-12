import { config as baseConfig } from '../spec-change/wdio.conf.js'

const capabilities = {
    browserA: { capabilities: { browserName: 'chrome', 'wdio:enforceWebDriverClassic': true } },
    browserB: { capabilities: { browserName: 'firefox', 'wdio:enforceWebDriverClassic': true } }
}

export const config = {
    ...baseConfig,
    capabilities: process.env.WDIO_WATCH_PARALLEL ? [capabilities, capabilities] : capabilities
}
