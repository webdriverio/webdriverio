import path from 'node:path'
import { expect, test, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'

import Auditor from '../src/auditor.js'
import type { LighthouseResultLike } from '../src/types.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const lighthouseResult: LighthouseResultLike = {
    audits: {
        diagnostics: {
            score: 1,
            details: {
                items: [{
                    numRequests: 8,
                    numScripts: 1,
                    totalByteWeight: 62929,
                    mainDocumentTransferSize: 8023
                }]
            }
        },
        'mainthread-work-breakdown': {
            score: 1,
            details: {
                items: [
                    { group: 'styleLayout', duration: 130.59 },
                    { group: 'scriptEvaluation', duration: 2.43 }
                ]
            }
        },
        metrics: {
            score: 1,
            details: {
                items: [{
                    observedDomContentLoaded: 3397,
                    observedFirstVisualChange: 2610,
                    observedFirstPaint: 2822,
                    firstContentfulPaint: 2822,
                    firstMeaningfulPaint: 2822,
                    largestContentfulPaint: 2822,
                    observedLastVisualChange: 15572,
                    interactive: 6135,
                    observedLoad: 8429,
                    speedIndex: 3259,
                    totalBlockingTime: 31,
                    maxPotentialFID: 161
                }]
            }
        },
        'server-response-time': { score: 1, numericValue: 566.4 },
        'first-contentful-paint': { score: 0.99, numericValue: 2822 },
        'largest-contentful-paint': { score: 0.95, numericValue: 2822 },
        'speed-index': { score: 0.9, numericValue: 3259 },
        'total-blocking-time': { score: 1, numericValue: 31 },
        'cumulative-layout-shift': { score: 1, numericValue: 0.01 },
        interactive: { score: 0.8, numericValue: 6135 },
        'max-potential-fid': { score: 0.7, numericValue: 161 },
        'interaction-to-next-paint': { score: null, numericValue: 120 }
    },
    categories: {
        performance: { score: 0.94 }
    }
}

let auditor: Auditor

beforeEach(() => {
    auditor = new Auditor(lighthouseResult)
})

test('getMainThreadWorkBreakdown', async () => {
    expect(await auditor.getMainThreadWorkBreakdown()).toEqual([
        { group: 'styleLayout', duration: 130.59 },
        { group: 'scriptEvaluation', duration: 2.43 }
    ])
})

test('getMainThreadWorkBreakdown returns empty list without Lighthouse data', async () => {
    expect(await new Auditor().getMainThreadWorkBreakdown()).toEqual([])
})

test('getMainThreadWorkBreakdown defaults missing group and duration', async () => {
    const incomplete = new Auditor({
        audits: {
            'mainthread-work-breakdown': {
                score: 1,
                details: { items: [{}, { group: 'scriptEvaluation', duration: 2 }] }
            }
        }
    })
    expect(await incomplete.getMainThreadWorkBreakdown()).toEqual([
        { group: '', duration: 0 },
        { group: 'scriptEvaluation', duration: 2 }
    ])
})

test('getDiagnostics', async () => {
    expect(await auditor.getDiagnostics()).toEqual({
        numRequests: 8,
        numScripts: 1,
        totalByteWeight: 62929,
        mainDocumentTransferSize: 8023
    })
})

test('getDiagnostics failing', async () => {
    expect(await new Auditor({ audits: { diagnostics: { score: 0 } } }).getDiagnostics()).toBe(null)
})

test('getMetrics', async () => {
    expect(await auditor.getMetrics()).toEqual({
        timeToFirstByte: 566,
        serverResponseTime: 566,
        domContentLoaded: 3397,
        firstVisualChange: 2610,
        firstPaint: 2822,
        firstContentfulPaint: 2822,
        firstMeaningfulPaint: 2822,
        largestContentfulPaint: 2822,
        lastVisualChange: 15572,
        interactive: 6135,
        load: 8429,
        speedIndex: 3259,
        totalBlockingTime: 31,
        maxPotentialFID: 161,
        cumulativeLayoutShift: 0.01,
        interactionToNextPaint: 120
    })
})

test('getMetrics falls back to individual audit numeric values', async () => {
    const fallbackAuditor = new Auditor({
        audits: {
            'server-response-time': { score: 1, numericValue: 100.2 },
            'first-contentful-paint': { score: 1, numericValue: 200 },
            'largest-contentful-paint': { score: 1, numericValue: 300 },
            'speed-index': { score: 1, numericValue: 400 },
            'total-blocking-time': { score: 1, numericValue: 5 },
            'cumulative-layout-shift': { score: 1, numericValue: 0.2 },
            interactive: { score: 1, numericValue: 500 },
            'max-potential-fid': { score: 1, numericValue: 12 }
        }
    })

    expect(await fallbackAuditor.getMetrics()).toMatchObject({
        timeToFirstByte: 100,
        firstContentfulPaint: 200,
        largestContentfulPaint: 300,
        speedIndex: 400,
        totalBlockingTime: 5,
        cumulativeLayoutShift: 0.2,
        interactive: 500,
        maxPotentialFID: 12
    })
})

test('getMetrics ignores non-finite values and falls back to observed CLS', async () => {
    const sparse = new Auditor({
        audits: {
            'server-response-time': { score: 1, numericValue: Number.NaN },
            metrics: {
                score: 1,
                details: { items: [{ cumulativeLayoutShift: 0.05 }] }
            }
        }
    })
    const metrics = await sparse.getMetrics()
    expect(metrics.timeToFirstByte).toBeUndefined()
    expect(metrics.cumulativeLayoutShift).toBe(0.05)
})

test('getPerformanceScore', async () => {
    expect(await auditor.getPerformanceScore()).toBe(0.94)
})

test('getPerformanceScore: returns null if the performance score is not available', async () => {
    expect(await new Auditor().getPerformanceScore()).toBe(null)
    expect(await new Auditor({ categories: { performance: { score: null } } }).getPerformanceScore()).toBe(null)
    expect(logger('').info).toBeCalled()
})

test('updateCommands', () => {
    const browser: any = { addCommand: vi.fn() }
    auditor.updateCommands(browser)

    expect(browser.addCommand)
        .toBeCalledWith('getMainThreadWorkBreakdown', expect.any(Function))
    expect(browser.addCommand)
        .toBeCalledWith('getDiagnostics', expect.any(Function))
    expect(browser.addCommand)
        .toBeCalledWith('getMetrics', expect.any(Function))
    expect(browser.addCommand)
        .toBeCalledWith('getPerformanceScore', expect.any(Function))
})

test('updateCommands can install a failing command wrapper', async () => {
    const browser: any = { addCommand: vi.fn() }
    const error = new Error('boom')
    auditor.updateCommands(browser, () => { throw error })

    expect(() => browser.addCommand.mock.calls[0][1]()).toThrow(error)
})

test('should not throw if no args passed', () => {
    expect(new Auditor()).toBeTruthy()
})
