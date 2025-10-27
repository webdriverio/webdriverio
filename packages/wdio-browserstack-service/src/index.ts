/* istanbul ignore file */

import BrowserstackLauncher from './launcher.js'
import BrowserstackService from './service.js'
import type { BrowserstackConfig } from './types.js'
import { configure } from './log4jsAppender.js'
import logReportingAPI from './logReportingAPI.js'

export default BrowserstackService
export const launcher = BrowserstackLauncher
export const log4jsAppender = { configure }
export const BStackTestOpsLogger = logReportingAPI

import * as Percy from './Percy/PercySDK.js'
export const PercySDK = Percy

import type { Options, Capabilities } from '@wdio/types'
export * from './types.js'

declare global {
    namespace WebdriverIO {
        interface ServiceOption extends BrowserstackConfig {}
    }
    interface State {
        value: number,
        toString: () => string
    }

    interface TestContextOptions {
        skipSessionName: boolean,
        skipSessionStatus: boolean,
        sessionNameOmitTestTitle: boolean,
        sessionNamePrependTopLevelSuiteTitle: boolean,
        sessionNameFormat: (
            config: Partial<Options.Testrunner>,
            capabilities: Partial<Capabilities.ResolvedTestrunnerCapabilities>,
            suiteTitle: string,
            testTitle?: string
        ) => string
    }

    interface GRRUrls {
        automate: {
            hub: string,
            cdp: string,
            api: string,
            upload: string
        },
        appAutomate: {
            hub: string,
            cdp: string,
            api: string,
            upload: string
        },
        percy: {
            api: string
        },
        turboScale: {
            api: string
        },
        accessibility: {
            api: string,
        },
        appAccessibility: {
            api: string
        },
        observability: {
            api: string,
            upload: string
        },
        configServer: {
            api: string
        },
        edsInstrumentation: {
            api: string
        }
    }
}
