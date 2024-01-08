import type { Browser } from 'webdriverio'
import PercyCaptureMap from '../Percy/PercyCaptureMap.js'

declare interface BrowserAsync extends Browser<'async'> {
    getAccessibilityResultsSummary: () => Promise<{ [key: string]: any; }>,
    getAccessibilityResults: () => Promise<Array<{ [key: string]: any; }>>,
    percyCaptureMap: PercyCaptureMap
}
