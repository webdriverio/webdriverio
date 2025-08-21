import type { Options, Capabilities } from '@wdio/types'

declare namespace WebdriverIO {
    interface Browser {
        getAccessibilityResultsSummary: () => Promise<Record<string, unknown>>,
        getAccessibilityResults: () => Promise<Array<Record<string, unknown>>>,
        performScan: () => Promise<Record<string, unknown> | undefined>,
        startA11yScanning: () => Promise<void>,
        stopA11yScanning: () => Promise<void>
    }

    interface MultiRemoteBrowser {
        getAccessibilityResultsSummary: () => Promise<Record<string, unknown>>,
        getAccessibilityResults: () => Promise<Array<Record<string, unknown>>>,
        performScan: () => Promise<Record<string, unknown> | undefined>,
        startA11yScanning: () => Promise<void>,
        stopA11yScanning: () => Promise<void>
    }
}

declare global {
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
            capabilities: Partial<Capabilities.RemoteCapability>,
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
