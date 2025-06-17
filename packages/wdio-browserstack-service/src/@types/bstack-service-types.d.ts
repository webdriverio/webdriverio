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
