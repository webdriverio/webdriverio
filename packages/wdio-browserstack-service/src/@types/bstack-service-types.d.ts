import type { Browser } from 'webdriverio'
declare interface BrowserAsync extends Browser<'async'> {
    getAccessibilityResultsSummary: () => Promise<{ [key: string]: any; }>,
    getAccessibilityResults: () => Promise<Array<{ [key: string]: any; }>>,
}
