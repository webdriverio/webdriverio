type PercyCaptureMap = import('../Percy/PercyCaptureMap.js').PercyCaptureMap

declare namespace WebdriverIO {
    interface Browser {
        getAccessibilityResultsSummary: () => Promise<{ [key: string]: any; }>,
        getAccessibilityResults: () => Promise<Array<{ [key: string]: any; }>>,
        percyCaptureMap: PercyCaptureMap
    }

    interface MultiRemoteBrowser {
        getAccessibilityResultsSummary: () => Promise<{ [key: string]: any; }>,
        getAccessibilityResults: () => Promise<Array<{ [key: string]: any; }>>,
        percyCaptureMap: PercyCaptureMap
    }
}
