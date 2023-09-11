declare namespace WebdriverIO {
    interface Browser {
        getAccessibilityResultsSummary: () => Promise<Object>,
        getAccessibilityResults: () => Promise<Array<{ [key: string]: any; }>>
    }

    interface MultiRemoteBrowser {
        getAccessibilityResultsSummary: () => Promise<Object>,
        getAccessibilityResults: () => Promise<Array<{ [key: string]: any; }>>
    }
}
