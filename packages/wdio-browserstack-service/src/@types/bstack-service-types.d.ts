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
