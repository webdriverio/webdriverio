import type { Viewport } from 'puppeteer-core/lib/puppeteer/common/Viewport.js'
import type { NETWORK_STATES, PWA_AUDIT_NAMES } from './constants.js'

export interface DevtoolsConfig {
    coverageReporter?: CoverageReporterOptions
}

/**
 * Report formats previously provided by `istanbul-reports`.
 * Kept as a local union so the public service options stay strict
 * without depending on Istanbul at runtime.
 */
export type CoverageReportType =
    | 'clover'
    | 'cobertura'
    | 'html-spa'
    | 'html'
    | 'json'
    | 'json-summary'
    | 'lcov'
    | 'lcovonly'
    | 'none'
    | 'teamcity'
    | 'text'
    | 'text-lcov'
    | 'text-summary'

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
    type?: CoverageReportType
    /**
     * Options for coverage report
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options?: any
    /**
     * Exclude code coverage files
     * @default []
     */
    exclude?: (RegExp | string)[]
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

export interface DeviceOptions {
    osVersion: string,
    inLandscape: boolean
}

export interface MainThreadWorkBreakdownResult {
    group: string
    duration: number
}

export interface DiagnosticsResult {
    numRequests?: number
    numScripts?: number
    numStylesheets?: number
    numFonts?: number
    numTasks?: number
    numTasksOver10ms?: number
    numTasksOver25ms?: number
    numTasksOver50ms?: number
    numTasksOver100ms?: number
    numTasksOver500ms?: number
    rtt?: number
    throughput?: number
    maxRtt?: number
    maxServerLatency?: number
    totalByteWeight?: number
    totalTaskTime?: number
    mainDocumentTransferSize?: number
    [key: string]: number | undefined
}

export interface PerformanceMetrics {
    timeToFirstByte?: number
    serverResponseTime?: number
    domContentLoaded?: number
    firstVisualChange?: number
    firstPaint?: number
    firstContentfulPaint?: number
    firstMeaningfulPaint?: number
    largestContentfulPaint?: number
    lastVisualChange?: number
    interactive?: number
    load?: number
    speedIndex?: number
    totalBlockingTime?: number
    maxPotentialFID?: number
    cumulativeLayoutShift?: number
    interactionToNextPaint?: number
}

export interface LHAuditResult {
    score: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    warnings?: any[]
    notApplicable?: boolean
    numericValue?: number
    numericUnit?: string
    displayValue?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details?: any
    explanation?: string
}

export interface AuditResult {
    passed: boolean
    details: Record<string, LHAuditResult>
}

export type PWAAudits = typeof PWA_AUDIT_NAMES[number]
export type NetworkStates = 'offline' | 'GPRS' | 'Regular 2G' | 'Good 2G' | 'Regular 3G' | 'Good 3G' | 'Regular 4G' | 'DSL' | 'Wifi' | 'online'

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

/**
 * Subset of a Lighthouse result used by the service commands.
 */
export interface LighthouseResultLike {
    audits?: Record<string, {
        id?: string
        score: number | null
        numericValue?: number
        displayValue?: string
        warnings?: unknown[]
        notApplicable?: boolean
        explanation?: string
        details?: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            items?: any[]
        }
    }>
    categories?: {
        performance?: {
            score: number | null
        }
    }
    finalDisplayedUrl?: string
    finalUrl?: string
    runtimeError?: {
        code?: string
        message?: string
    }
}

export interface LighthouseFlowResultLike {
    steps: Array<{
        lhr: LighthouseResultLike
        name?: string
    }>
}

export interface LighthouseFlow {
    startNavigation: (flags?: Record<string, unknown>) => Promise<void>
    endNavigation: () => Promise<void>
    navigate: (url: string | (() => Promise<void>), flags?: Record<string, unknown>) => Promise<void>
    startTimespan: (flags?: Record<string, unknown>) => Promise<void>
    endTimespan: () => Promise<void>
    snapshot: (flags?: Record<string, unknown>) => Promise<void>
    createFlowResult: () => Promise<LighthouseFlowResultLike>
    dispose?: () => void
}
