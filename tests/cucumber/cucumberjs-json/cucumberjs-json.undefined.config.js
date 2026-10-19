import { config as cucumberJsJsonConfig } from './cucumberjs-json.config.js'

export const config = {
    ...cucumberJsJsonConfig,
    cucumberOpts: {
        ...cucumberJsJsonConfig.cucumberOpts,
        ignoreUndefinedDefinitions: true
    }
}
