import path from 'node:path'
import { expect, test, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import type { Trace } from '../src/gatherer/trace'

import Auditor from '../src/auditor'

vi.mock('lighthouse/lighthouse-core/audits/diagnostics')
vi.mock('lighthouse/lighthouse-core/audits/mainthread-work-breakdown')
vi.mock('lighthouse/lighthouse-core/audits/metrics')
vi.mock('lighthouse/lighthouse-core/audits/server-response-time')
vi.mock('lighthouse/lighthouse-core/audits/metrics/cumulative-layout-shift')
vi.mock('lighthouse/lighthouse-core/audits/metrics/first-contentful-paint')
vi.mock('lighthouse/lighthouse-core/audits/metrics/largest-contentful-paint')
vi.mock('lighthouse/lighthouse-core/audits/metrics/speed-index')
vi.mock('lighthouse/lighthouse-core/audits/metrics/interactive')
vi.mock('lighthouse/lighthouse-core/audits/metrics/total-blocking-time')
vi.mock('lighthouse/lighthouse-core/config/default-config')
vi.mock('lighthouse/lighthouse-core/audits/installable-manifest')
vi.mock('lighthouse/lighthouse-core/audits/service-worker')
vi.mock('lighthouse/lighthouse-core/audits/splash-screen')
vi.mock('lighthouse/lighthouse-core/audits/themed-omnibox')
vi.mock('lighthouse/lighthouse-core/audits/content-width')
vi.mock('lighthouse/lighthouse-core/audits/viewport')
vi.mock('lighthouse/lighthouse-core/audits/apple-touch-icon')
vi.mock('lighthouse/lighthouse-core/audits/maskable-icon')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

let auditor: Auditor

beforeEach(() => {
    auditor = new Auditor({} as unknown as Trace, [])
})

test('getMainThreadWorkBreakdown', async () => {
    expect(await auditor.getMainThreadWorkBreakdown()).toMatchSnapshot()
})

test('getDiagnostics', async () => {
    expect(await auditor.getDiagnostics()).toMatchSnapshot()
})

test('getDiagnostics failing', async () => {
    auditor._audit = vi.fn().mockReturnValue(Promise.resolve({}))
    expect(await auditor.getDiagnostics()).toBe(null)
})

test('getMetrics', async () => {
    expect(await auditor.getMetrics()).toMatchSnapshot()
})

test('getPerformanceScore', async () => {
    expect(await auditor.getPerformanceScore()).toMatchSnapshot()
})

test('getPerformanceScore: returns null if any of the metrics is not available', async () => {
    auditor._audit = vi.fn().mockReturnValueOnce(Promise.resolve({}))
    expect(await auditor.getPerformanceScore()).toBe(null)

    auditor._audit = vi.fn().mockReturnValueOnce(Promise.resolve({
        'first-contentful-paint': {
            score: 1
        },
    }))
    expect(await auditor.getPerformanceScore()).toBe(null)

    auditor._audit = vi.fn().mockReturnValueOnce(Promise.resolve({
        'first-contentful-paint': {
            score: 1
        },
        'speed-index': {
            score: 1
        },
    }))
    expect(await auditor.getPerformanceScore()).toBe(null)

    auditor.getMetrics = vi.fn().mockReturnValueOnce(Promise.resolve({
        'first-contentful-paint': {
            score: 1
        },
        'speed-index': {
            score: 1
        },
        'largest-contentful-paint': {
            score: 1
        },
    }))
    expect(await auditor.getPerformanceScore()).toBe(null)

    auditor._audit = vi.fn().mockReturnValueOnce(Promise.resolve({
        'first-contentful-paint': {
            score: 1
        },
        'speed-index': {
            score: 1
        },
        'largest-contentful-paint': {
            score: 1
        },
        'cumulative-layout-shift': {
            score: 1
        },
        'total-blocking-time': {
            score: 1
        }
    }))
    expect(await auditor.getPerformanceScore()).toBe(null)

    auditor._audit = vi.fn().mockReturnValue(Promise.resolve({
        'first-contentful-paint': {
            score: 1
        },
        'speed-index': {
            score: 1
        },
        'largest-contentful-paint': {
            score: 1
        },
        'cumulative-layout-shift': {
            score: 1
        },
        'total-blocking-time': {
            score: 1
        },
        'interactive': {
            score: 1
        },
    }))
    expect(await auditor.getPerformanceScore())
        .toEqual(expect.any(Number))
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

test('should not throw if no args passed', () => {
    const auditor = new Auditor()
    expect(auditor).toBeTruthy()
})

test('should throw if something fails', () => {
    const error = new Error('uups')
    const Audit = {
        defaultOptions: {},
        audit: vi.fn().mockImplementation(() => {
            throw error
        })
    }
    expect(auditor._audit(Audit)).toEqual({
        score: 0,
        error
    })
    expect(logger('').error).toBeCalledTimes(1)
})

test('should allow to audit PWA results', async () => {
    const auditor = new Auditor()
    expect(await auditor._auditPWA({ foo: 'bar' })).toMatchSnapshot()
    expect(await auditor._auditPWA(
        { foo: 'bar' },
        ['maskableIcon', 'serviceWorker']
    )).toMatchSnapshot()
})
