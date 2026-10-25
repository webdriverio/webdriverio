import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import WDIOReporter from '@wdio/reporter'
import type { SuiteStats } from '@wdio/reporter'

import JsonGenerator from '../src/jsonGenerator.js'
import { HtmlReporterOptions, ReportData } from '../src/types.js'

describe('JsonGenerator.removeOutput', () => {
    it('clears the output of the tests and of the hooks, also in nested suites', () => {
        const output = () => [{ type: 'result', body: { value: 'iVBORw0KGgo' } }]
        const inner = { tests: [{ output: output() }], hooks: [{ output: output() }, {}], suites: [] }
        const suites = [{ tests: [{ output: output() }], hooks: [{ output: output() }], suites: [inner] }] as unknown as SuiteStats[]

        JsonGenerator.removeOutput(suites)

        expect(suites[0].tests[0].output).toEqual([])
        expect(suites[0].hooks[0].output).toEqual([])
        expect(inner.tests[0].output).toEqual([])
        expect(inner.hooks[0].output).toEqual([])
        // a hook with no command keeps no output field
        expect('output' in inner.hooks[1]).toBe(false)
    })
})

describe('JsonGenerator.jsonOutput', () => {
    // the JSON keys of a hook on main 2c6277f34; K32 adds `state` to a skipped hook
    const MAIN_KEYS = ['_duration', 'cid', 'end', 'errors', 'parent', 'start', 'title', 'type', 'uid']

    const hookJson = async (removeOutput: boolean) => {
        const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'html-json-'))
        // the real base: it gives the hook stats their fields
        const base = new WDIOReporter({ stdout: true, writeStream: { write: () => true } } as never)
        const emit = (event: string, payload: Record<string, unknown>) => base.emit(event, { type: event, cid: '0-0', specs: ['/spec.js'], ...payload })
        const hook = (uid: string, kind: string, extra: Record<string, unknown> = {}) => {
            const payload = { uid, title: `"${kind}" hook ${uid}`, parent: 'A', hookKind: kind, hookSuiteUid: 's1', ...extra }
            emit('hook:start', payload)
            base.emit('client:beforeCommand', { sessionId: 's', method: 'GET', endpoint: '/url', body: {} })
            emit('hook:end', payload)
        }
        emit('suite:start', { uid: 's1', title: 'A', fullTitle: 'A', file: '/spec.js' })
        hook('passed', 'beforeAll')
        hook('failed', 'beforeAll', { error: { message: 'boom' } })
        hook('skipped', 'beforeAll', { pending: true })
        emit('test:start', { uid: 't1', title: 't1', fullTitle: 'A t1', parent: 'A' })
        emit('test:pass', { uid: 't1', title: 't1', fullTitle: 'A t1', parent: 'A' })
        emit('test:end', { uid: 't1', title: 't1', fullTitle: 'A t1', parent: 'A' })
        hook('after', 'afterAll')
        emit('suite:end', { uid: 's1', title: 'A', fullTitle: 'A', file: '/spec.js' })

        const reportFile = path.join(outputDir, 'report-0-0.html')
        const options = Object.assign(new HtmlReporterOptions(), { outputDir, removeOutput, produceJson: true })
        await JsonGenerator.jsonOutput(options, new ReportData('t', {} as never, [base.suites.s1], {} as never, reportFile, 'chrome'))
        const json = JSON.parse(fs.readFileSync(path.join(outputDir, 'report-0-0.json'), 'utf8'))
        fs.rmSync(outputDir, { recursive: true, force: true })
        return json.suites[0] as { hooks: Record<string, unknown>[], tests: Record<string, unknown>[] }
    }

    it.each([true, false])('writes a hook with the keys of main, also with removeOutput: %s', async (removeOutput) => {
        const suite = await hookJson(removeOutput)

        expect(Object.fromEntries(suite.hooks.map((hook) => [hook.uid, Object.keys(hook).sort()]))).toEqual({
            passed: MAIN_KEYS,
            failed: [...MAIN_KEYS, 'error', 'state'].sort(),
            skipped: [...MAIN_KEYS, 'state'].sort(),
            after: MAIN_KEYS,
        })
        expect(suite.hooks.find((hook) => hook.uid === 'skipped')?.state).toBe('skipped')
        // a test keeps its output
        expect(suite.tests[0]).toHaveProperty('output')
    })
})
