import path from 'node:path'
import { expect, test, vi } from 'vitest'

import {
    sumByKey,
    setUnsupportedCommand,
    isSupportedUrl,
    parseTraceBuffer,
    isInternalBrowserPage,
    resolveAuditablePage,
    getAuditablePuppeteerPage,
    hasCorePerformanceMetrics,
    selectLighthouseResult,
    describeLighthouseResult
} from '../src/utils.js'
import type { RequestPayload } from '../src/handler/network.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

test('sumByKey', () => {
    expect(sumByKey([{
        size: 1
    } as unknown as RequestPayload, {
        size: 2
    } as unknown as RequestPayload, {
        size: 3
    } as unknown as RequestPayload], 'size')).toBe(6)
})

test('setUnsupportedCommand', () => {
    const browser = { addCommand: vi.fn() }
    setUnsupportedCommand(browser as unknown as WebdriverIO.Browser)
    expect(browser.addCommand).toHaveBeenCalledWith('getMetrics', expect.any(Function), expect.any(Object))
    expect(browser.addCommand).toHaveBeenCalledWith('getPerformanceScore', expect.any(Function), expect.any(Object))
    const fn = browser.addCommand.mock.calls[0][1]
    expect(fn).toThrow()
})

test('isSupportedUrl', () => {
    expect(isSupportedUrl('https://webdriver.io')).toBe(true)
    expect(isSupportedUrl('data:,')).toBe(false)
    expect(isSupportedUrl('about:blank')).toBe(false)
    expect(isSupportedUrl('chrome-extension://abc')).toBe(false)
})

test('parseTraceBuffer decodes a Buffer containing a trace object', () => {
    const payload = { traceEvents: [{ name: 'navigationStart' }], otherData: { key: 1 } }
    expect(parseTraceBuffer(Buffer.from(JSON.stringify(payload)))).toEqual(payload)
})

test('parseTraceBuffer decodes a Uint8Array the way Puppeteer 24+ returns it', () => {
    const payload = { traceEvents: [{ name: 'EvaluateScript' }] }
    const bytes = new TextEncoder().encode(JSON.stringify(payload))
    expect(parseTraceBuffer(bytes)).toEqual(payload)
    expect(bytes.toString()).toMatch(/^\d+(,\d+)*$/)
})

test('parseTraceBuffer respects a non-zero Uint8Array byteOffset', () => {
    const payload = { traceEvents: [{ name: 'Layout' }] }
    const json = new TextEncoder().encode(JSON.stringify(payload))
    const padded = new Uint8Array(json.length + 4)
    padded.set(json, 2)
    expect(parseTraceBuffer(padded.subarray(2, 2 + json.length))).toEqual(payload)
})

test('parseTraceBuffer accepts a JSON string and strips a BOM', () => {
    const payload = { traceEvents: [{ name: 'Paint' }] }
    expect(parseTraceBuffer(`\uFEFF${JSON.stringify(payload)}`)).toEqual(payload)
})

test('parseTraceBuffer wraps a top-level event array', () => {
    const events = [{ name: 'navigationStart' }, { name: 'Paint' }]
    expect(parseTraceBuffer(JSON.stringify(events))).toEqual({ traceEvents: events })
})

test('parseTraceBuffer throws when the buffer is not JSON', () => {
    expect(() => parseTraceBuffer(Buffer.from('not-json'))).toThrow(SyntaxError)
})

test('parseTraceBuffer throws when JSON is not an object or array', () => {
    expect(() => parseTraceBuffer('42')).toThrow('Trace buffer did not contain JSON trace data')
    expect(() => parseTraceBuffer('null')).toThrow('Trace buffer did not contain JSON trace data')
})

test('isInternalBrowserPage detects mapper and DevTools targets', () => {
    expect(isInternalBrowserPage('http://localhost:1/BiDi-CDP Mapper')).toBe(true)
    expect(isInternalBrowserPage('devtools://devtools/bundled/inspector.html')).toBe(true)
    expect(isInternalBrowserPage('chrome-extension://abc/popup.html')).toBe(true)
    expect(isInternalBrowserPage('https://webdriver.io')).toBe(false)
})

test('resolveAuditablePage prefers the page that matches the current URL', () => {
    const mapper = { url: () => 'http://localhost:1/BiDi-CDP Mapper' }
    const blank = { url: () => 'about:blank' }
    const guinea = { url: () => 'https://guinea-pig.webdriver.io/' }

    expect(resolveAuditablePage([mapper, blank, guinea], 'https://guinea-pig.webdriver.io/')).toBe(guinea)
    expect(resolveAuditablePage([mapper, blank], 'about:blank')).toBe(blank)
    expect(resolveAuditablePage([mapper], 'https://webdriver.io')).toBeUndefined()
    expect(resolveAuditablePage([mapper, guinea])).toBe(guinea)
})

test('getAuditablePuppeteerPage falls back to waitForTarget when pages() is empty', async () => {
    const page = { url: () => 'https://webdriver.io/' }
    const puppeteer = {
        pages: vi.fn().mockResolvedValue([]),
        waitForTarget: vi.fn().mockResolvedValue({ page: vi.fn().mockResolvedValue(page) })
    }

    await expect(getAuditablePuppeteerPage(puppeteer, 'https://webdriver.io/')).resolves.toBe(page)
    expect(puppeteer.waitForTarget).toHaveBeenCalled()
})

test('getAuditablePuppeteerPage returns undefined when no page can be resolved', async () => {
    await expect(getAuditablePuppeteerPage({ pages: async () => [] })).resolves.toBeUndefined()
})

test('hasCorePerformanceMetrics and selectLighthouseResult inspect Lighthouse LHRs', () => {
    const empty = { categories: { performance: { score: null } } }
    const partial = {
        audits: { 'first-contentful-paint': { score: 1, numericValue: 120 } },
        finalDisplayedUrl: 'https://webdriver.io/'
    }
    const complete = {
        audits: {
            'first-contentful-paint': { score: 1, numericValue: 120 },
            'largest-contentful-paint': { score: 1, numericValue: 180 },
            'speed-index': { score: 1, numericValue: 150 }
        },
        finalDisplayedUrl: 'https://webdriver.io/'
    }

    expect(hasCorePerformanceMetrics(undefined)).toBe(false)
    expect(hasCorePerformanceMetrics(empty)).toBe(false)
    expect(hasCorePerformanceMetrics(partial)).toBe(false)
    expect(hasCorePerformanceMetrics(complete)).toBe(true)
    expect(selectLighthouseResult({ steps: [{ lhr: empty }, { lhr: complete }] })).toBe(complete)
    expect(selectLighthouseResult({ steps: [{ lhr: empty }] })).toBe(empty)
    expect(describeLighthouseResult(complete)).toContain('url=https://webdriver.io/')
    expect(describeLighthouseResult({ runtimeError: { code: 'NO_FCP', message: 'missing paint' } }))
        .toContain('NO_FCP: missing paint')
})
