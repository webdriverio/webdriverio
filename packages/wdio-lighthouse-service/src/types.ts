import type { TraceStreamJson } from '@tracerbench/trace-event'
import type { NETWORK_STATES, PWA_AUDITS } from './constants.js'

export type FormFactor = 'mobile' | 'desktop' | 'none'

export interface EnablePerformanceAuditsOptions {
    cacheEnabled: boolean
    cpuThrottling: number
    networkThrottling: keyof typeof NETWORK_STATES
    formFactor: FormFactor
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
            observedDomContentLoaded: number
            observedFirstVisualChange: number
            observedFirstPaint: number
            firstContentfulPaint: number
            firstMeaningfulPaint: number
            largestContentfulPaint: number
            observedLastVisualChange: number
            interactive: number
            observedLoad: number
            speedIndex: number
            totalBlockingTime: number
            maxPotentialFID: number
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

export interface GathererDriver {
    beginTrace (): Promise<void>
    endTrace (): Promise<TraceStreamJson>
    evaluate (script: Function, args: Object): Promise<any>
}
