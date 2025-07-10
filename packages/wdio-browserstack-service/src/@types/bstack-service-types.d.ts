declare namespace WebdriverIO {
    interface Browser {
        getAccessibilityResultsSummary: () => Promise<{ [key: string]: any; }>,
        getAccessibilityResults: () => Promise<Array<{ [key: string]: any; }>>,
        performScan: () => Promise<{ [key: string]: any; } | undefined>
    }

    interface MultiRemoteBrowser {
        getAccessibilityResultsSummary: () => Promise<{ [key: string]: any; }>,
        getAccessibilityResults: () => Promise<Array<{ [key: string]: any; }>>,
        performScan: () => Promise<{ [key: string]: any; } | undefined>
    }
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
        config: Partial<import('@wdio/types').Options.Testrunner>,
        capabilities: Partial<import('@wdio/types').Capabilities.RemoteCapability>,
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
