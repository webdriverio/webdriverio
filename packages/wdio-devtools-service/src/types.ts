import type { ReportOptions } from 'istanbul-reports'
import type { Totals, CoverageSummaryData } from 'istanbul-lib-coverage'
import type { Viewport } from 'puppeteer-core/lib/cjs/puppeteer/common/PuppeteerViewport'
import type { NETWORK_STATES, PWA_AUDITS } from './constants'

export interface DevtoolsConfig {
    coverageReporter?: CoverageReporterOptions
}

export interface CoverageReporterOptions {
    /**
     * whether or not to enable code coverage reporting
     * @default false
     */
    enable?: boolean
    /**
     * Directory where JS coverage reports are stored
     */
    logDir?: string
    /**
     * format of report
     * @default json
     */
    type?: keyof ReportOptions
    /**
     * Options for coverage report
     */
    options?: any
}

export type FormFactor = 'mobile' | 'desktop' | 'none'

export interface EnablePerformanceAuditsOptions {
    cacheEnabled: boolean
    cpuThrottling: number
    networkThrottling: keyof typeof NETWORK_STATES
    formFactor: FormFactor
}

export interface DeviceDescription {
    viewport: Viewport;
    userAgent: string;
}

export interface Device {
    name: string;
    userAgent: string;
    viewport: {
        width: number;
        height: number;
        deviceScaleFactor: number;
        isMobile: boolean;
        hasTouch: boolean;
        isLandscape: boolean;
    };
}

export interface Audit {
    audit: (opts: any, context: any) => Promise<any>,
    defaultOptions: Record<string, any>
}

export interface AuditResults {
    'speed-index': MetricsResult
    'first-contentful-paint': MetricsResult
    'largest-contentful-paint': MetricsResult
    'cumulative-layout-shift': MetricsResult
    'total-blocking-time': MetricsResult
    interactive: MetricsResult
}

export interface AuditRef {
    id: keyof AuditResults
    weight: number
}

export interface MainThreadWorkBreakdownResult {
    details: {
        items: {
            group: string,
            duration: number
        }[]
    }
}

export interface DiagnosticsResults {
    details: {
        items: any[]
    }
}

export interface ResponseTimeResult {
    numericValue: number
}

export interface MetricsResult {
    score: number
}

export interface MetricsResults {
    details: {
        items: {
            estimatedInputLatency: number
            observedDomContentLoaded: number
            observedFirstVisualChange: number
            observedFirstPaint: number
            firstContentfulPaint: number
            firstMeaningfulPaint: number
            largestContentfulPaint: number
            observedLastVisualChange: number
            firstCPUIdle: number
            interactive: number
            observedLoad: number
            speedIndex: number
            totalBlockingTime: number
        }[]
    }
}

export interface LHAuditResult {
    score: number
    warnings?: any[]
    notApplicable?: boolean
    numericValue?: number
    numericUnit?: string
    displayValue?: {
        i18nId: string
        values: any
        formattedDefault: string
    }
    details?: any
}

export interface AuditResult {
    passed: boolean
    details: Record<string, LHAuditResult | ErrorAudit>
}

export interface ErrorAudit {
    score: 0
    error: Error
}

export type PWAAudits = keyof typeof PWA_AUDITS
export type NetworkStates = 'offline' | 'GPRS' | 'Regular 2G' | 'Good 2G' | 'Regular 3G' | 'Good 3G' | 'Regular 4G' | 'DSL' | 'Wifi' | 'online';

export interface Coverage {
    lines: Totals
    statements: Totals
    functions: Totals
    branches: Totals
    files: Record<string, CoverageSummaryData>
}

export interface CustomDevice {
    viewport: Viewport,
    userAgent: string
}

export type DeviceProfiles = 'Blackberry PlayBook' | 'BlackBerry Z30' | 'Galaxy Note 3' | 'Galaxy Note II' | 'Galaxy S III' | 'Galaxy S5' | 'iPad' | 'iPad Mini' | 'iPad Pro' | 'iPhone 4' | 'iPhone 5' | 'iPhone 6' | 'iPhone 6 Plus' | 'iPhone 7' | 'iPhone 7 Plus' | 'iPhone 8' | 'iPhone 8 Plus' | 'iPhone SE' | 'iPhone X' | 'JioPhone 2' | 'Kindle Fire HDX' | 'LG Optimus L70' | 'Microsoft Lumia 550' | 'Microsoft Lumia 950' | 'Nexus 10' | 'Nexus 4' | 'Nexus 5' | 'Nexus 5X' | 'Nexus 6' | 'Nexus 6P' | 'Nexus 7' | 'Nokia Lumia 520' | 'Nokia N9' | 'Pixel 2' | 'Pixel 2 XL' | CustomDevice

export interface PerformanceAuditOptions {
    /**
     * Network throttling artificially limits the maximum download throughput (rate of data transfer). (e.g. Fast 3G).
     */
    networkThrottling?: NetworkStates,
    /**
     * Define CPU throttling to understand how your page performs under that constraint (e.g. 1.5).
     */
    cpuThrottling?: number,
    /**
     * Enable or disable cache of resources. Defaults to true.
     */
    cacheEnabled?: boolean
}

export interface DevtoolsBrowser {
    /**
     * Enables auto performance audits for all page loads that are cause by calling the url command or clicking on a link or anything that causes a page load.
     * You can pass in a config object to determine some throttling options. The default throttling profile is Good 3G network with a 4x CPU trottling.
     */
    enablePerformanceAudits(params?: PerformanceAuditOptions): void;
    /**
     * Disable the performance audits
     */
    disablePerformanceAudits(): void;
    /**
     * Get most common used performance metrics
     */
    getMetrics(): object;
    /**
     * Get some useful diagnostics about the page load
     */
    getDiagnostics(): object;
    /**
     * Returns a list with a breakdown of all main thread task and their total duration
     */
    getMainThreadWorkBreakdown(): object[];
    /**
     * Returns the Lighthouse Performance Score which is a weighted mean of the following metrics: firstMeaningfulPaint, firstCPUIdle, firstInteractive, speedIndex, estimatedInputLatency
     */
    getPerformanceScore(): number;

    /**
     * The service allows you to emulate a specific device type.
     * If set, the browser viewport will be modified to fit the device capabilities as well as the user agent will set according to the device user agent.
     * Note: This only works if you don't use mobileEmulation within capabilities['goog:chromeOptions']. If mobileEmulation is present the call to browser.emulateDevice() won't do anything.
     */
    emulateDevice(deviceProfile: DeviceProfiles): void;

    /**
     * Runs various PWA Lighthouse audits on the current opened page.
     * Read more about Lighthouse PWA audits at https://web.dev/lighthouse-pwa/.
     */
    checkPWA(auditsToBeRun?: PWAAudits[]): AuditResult;

    /**
     * Returns the coverage report for the current opened page.
     */
    getCoverageReport(): Coverage;

    /**
     * The cdp command is a custom command added to the browser scope that allows you to call directly commands to the protocol.
     */
    cdp(
        domain: string,
        command: string,
        args?: object
    ): any;
    /**
     * Returns the host and port the Chrome DevTools interface is connected to.
     */
    cdpConnection(): { host: string, port: number };
    /**
     * Helper method to get the nodeId of an element in the page.
     * NodeIds are similar like WebDriver node ids an identifier for a node.
     * It can be used as a parameter for other Chrome DevTools methods, e.g. DOM.focus.
     */
    getNodeId(selector: string): number;
    /**
     * Helper method to get the nodeId of an element in the page.
     * NodeIds are similar like WebDriver node ids an identifier for a node.
     * It can be used as a parameter for other Chrome DevTools methods, e.g. DOM.focus.
     */
    getNodeIds(selector: string): number[];
    /**
     * Start tracing the browser. You can optionally pass in custom tracing categories and the sampling frequency.
     */
    startTracing(
    categories?: string,
    samplingFrequency?: number
    ): void;
    /**
     * Stop tracing the browser.
     */
    endTracing(): void;
    /**
     * Returns the tracelogs that was captured within the tracing period.
     * You can use this command to store the trace logs on the file system to analyse the trace via Chrome DevTools interface.
     */
    getTraceLogs(): object;
    /**
     * Returns page weight information of the last page load.
     */
    getPageWeight(): object;
}
