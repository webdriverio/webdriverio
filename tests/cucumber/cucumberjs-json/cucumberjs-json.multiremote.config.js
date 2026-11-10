import { config as cucumberJsJsonConfig } from './cucumberjs-json.config.js'

export const config = {
    ...cucumberJsJsonConfig,
    capabilities: {
        browserA: { capabilities: { browserName: 'chrome', 'cjson:metadata': { device: 'Device A' } } },
        browserB: { capabilities: { browserName: 'chrome', 'cjson:metadata': { device: 'Device B' } } }
    }
}
