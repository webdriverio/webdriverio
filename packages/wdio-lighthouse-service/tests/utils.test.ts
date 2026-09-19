import path from 'node:path'
import { expect, test, vi } from 'vitest'

import { sumByKey, setUnsupportedCommand, isSupportedUrl, parseTraceBuffer } from '../src/utils.js'
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
