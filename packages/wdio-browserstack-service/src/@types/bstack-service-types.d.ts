declare namespace WebdriverIO {
    import PercyCaptureMap from '../Percy/PercyCaptureMap.js'
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
