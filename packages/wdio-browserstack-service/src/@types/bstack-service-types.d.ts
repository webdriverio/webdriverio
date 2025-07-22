declare namespace WebdriverIO {
    interface Browser {
        getAccessibilityResultsSummary: () => Promise<{ [key: string]: any; }>,
        getAccessibilityResults: () => Promise<Array<{ [key: string]: any; }>>,
        performScan: () => Promise<{ [key: string]: any; } | undefined>,
        startA11yScanning: () => Promise<void>,
        stopA11yScanning: () => Promise<void>
    }

    interface MultiRemoteBrowser {
        getAccessibilityResultsSummary: () => Promise<{ [key: string]: any; }>,
        getAccessibilityResults: () => Promise<Array<{ [key: string]: any; }>>,
        performScan: () => Promise<{ [key: string]: any; } | undefined>,
        startA11yScanning: () => Promise<void>,
        stopA11yScanning: () => Promise<void>
    }
}
