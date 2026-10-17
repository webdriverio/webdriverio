import type { cjson_metadata } from '../types.js'

declare global {
    namespace NodeJS {
        export interface EnvironmentVariables {
            wdioCucumberJsReporter: string
            attachment: string
        }

        export interface Global {
            browser: WebdriverIO.Browser
        }
    }

    namespace WebDriver {
        export interface W3CCapabilities {
            cjson_metadata: cjson_metadata
        }
    }
}
