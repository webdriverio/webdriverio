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
    // the JSON keys of a hook before the `state` field was added to a skipped hook
    const EARLIER_KEYS = ['_duration', 'cid', 'end', 'errors', 'parent', 'start', 'title', 'type', 'uid']

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

        // with removeOutput: false a hook that has commands also has its `output`
        const keys = (extra: string[]) => (removeOutput ? extra : [...extra, 'output']).sort()
        expect(Object.fromEntries(suite.hooks.map((hook) => [hook.uid, Object.keys(hook).sort()]))).toEqual({
            passed: keys(EARLIER_KEYS),
            failed: keys([...EARLIER_KEYS, 'error', 'state']),
            skipped: keys([...EARLIER_KEYS, 'state']),
            after: keys(EARLIER_KEYS),
        })
        expect(suite.hooks.find((hook) => hook.uid === 'skipped')?.state).toBe('skipped')
        // a test keeps its output
        expect(suite.tests[0]).toHaveProperty('output')
    })
})

describe('JsonGenerator.jsonOutput, commands of a hook', () => {
    type Node = { uid?: string, hooks: { uid: string, output?: { body?: { url?: string } }[] }[], suites?: Node[] }

    const cmd = (url: string) => ({ sessionId: 's', method: 'POST', endpoint: '/session/:sessionId/url', body: { url } })

    const run = async (framework: string, removeOutput: boolean, script: (emit: (e: string, p: Record<string, unknown>) => void, base: WDIOReporter) => void) => {
        const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'html-json-'))
        const base = new WDIOReporter({ stdout: true, writeStream: { write: () => true } } as never)
        const emit = (event: string, payload: Record<string, unknown>) => base.emit(event, { cid: '0-0', file: '/spec.js', ...payload })
        emit('runner:start', { specs: ['/spec.js'], config: { framework }, capabilities: { browserName: 'chrome' }, sessionId: 's', isMultiRemote: false, instanceOptions: {} })
        script(emit, base)
        const roots = Object.values(base.suites).filter((suite) => !suite.parent || suite.type === 'feature')
        const reportFile = path.join(outputDir, 'report-0-0.html')
        const options = Object.assign(new HtmlReporterOptions(), { outputDir, removeOutput, produceJson: true })
        await JsonGenerator.jsonOutput(options, new ReportData('t', {} as never, roots, {} as never, reportFile, 'chrome'))
        const json = JSON.parse(fs.readFileSync(path.join(outputDir, 'report-0-0.json'), 'utf8'))
        fs.rmSync(outputDir, { recursive: true, force: true })
        return json.suites as Node[]
    }

    const urls = (hook: { output?: { body?: { url?: string } }[] }) => hook.output?.map((o) => o.body?.url)

    // sequential Cucumber, the Before hook of scenario 2
    const cucumber = (emit: (e: string, p: Record<string, unknown>) => void) => {
        emit('suite:start', { uid: 'F', title: 'F', fullTitle: 'F', type: 'feature' })
        for (const sc of ['SC1', 'SC2']) {
            emit('suite:start', { uid: sc, title: sc, fullTitle: sc, type: 'scenario', parent: 'F' })
            const hook = { uid: `${sc}-Before`, title: 'Before', type: 'hook', parent: sc, hookKind: 'beforeEach' }
            emit('hook:start', hook)
            emit('client:beforeCommand', cmd(`${sc}-before-url`))
            emit('client:afterCommand', { ...cmd(`${sc}-before-url`), result: { value: null } })
            emit('hook:end', hook)
            const step = { uid: `${sc}-step`, title: 'step', fullTitle: 'step', type: 'test', parent: sc }
            emit('test:start', step)
            emit('test:pass', step)
            emit('test:end', step)
            emit('suite:end', { uid: sc, title: sc, fullTitle: sc, type: 'scenario' })
        }
        emit('suite:end', { uid: 'F', title: 'F', fullTitle: 'F', type: 'feature' })
    }

    // Mocha, the before all hook of a second suite
    const mocha = (emit: (e: string, p: Record<string, unknown>) => void) => {
        const test = (uid: string) => ({ uid, title: uid, fullTitle: uid, type: 'test' })
        emit('suite:start', { uid: 'S1', title: 'S1', fullTitle: 'S1', type: 'suite' })
        emit('test:start', test('t1'))
        emit('test:pass', test('t1'))
        emit('test:end', test('t1'))
        emit('suite:end', { uid: 'S1', title: 'S1', fullTitle: 'S1' })
        emit('suite:start', { uid: 'S2', title: 'S2', fullTitle: 'S2', type: 'suite' })
        const hook = { uid: 'before-S2', title: 'before all', type: 'hook', hookKind: 'beforeAll', hookSuiteUid: 'S2' }
        emit('hook:start', hook)
        emit('client:beforeCommand', cmd('before-S2-url'))
        emit('client:afterCommand', { ...cmd('before-S2-url'), result: { value: null } })
        emit('hook:end', hook)
        emit('test:start', test('t2'))
        emit('test:pass', test('t2'))
        emit('test:end', test('t2'))
        emit('suite:end', { uid: 'S2', title: 'S2', fullTitle: 'S2' })
    }

    const cases = [
        { name: 'Before of scenario 2', framework: 'cucumber', script: cucumber, pick: (roots: Node[]) => roots[0].suites!.find((s) => s.uid === 'SC2')!.hooks[0], url: 'SC2-before-url' },
        { name: 'before all of a suite', framework: 'mocha', script: mocha, pick: (roots: Node[]) => roots.find((s) => s.uid === 'S2')!.hooks[0], url: 'before-S2-url' },
    ]

    it.each(cases)('$name: keeps its command in the hook output with removeOutput: false', async ({ framework, script, pick, url }) => {
        const hook = pick(await run(framework, false, script))
        // the base keeps the command and its result
        expect(new Set(urls(hook))).toEqual(new Set([url]))
    })

    it.each(cases)('$name: has no output key with removeOutput: true', async ({ framework, script, pick }) => {
        const hook = pick(await run(framework, true, script))
        expect(hook).not.toHaveProperty('output')
    })

    it.each([true, false])('a hook with no command has no output key, removeOutput: %s', async (removeOutput) => {
        const roots = await run('mocha', removeOutput, (emit) => {
            emit('suite:start', { uid: 'S', title: 'S', fullTitle: 'S', type: 'suite' })
            const hook = { uid: 'h', title: 'before all', type: 'hook', hookKind: 'beforeAll', hookSuiteUid: 'S' }
            emit('hook:start', hook)
            emit('hook:end', hook)
            emit('suite:end', { uid: 'S', title: 'S', fullTitle: 'S' })
        })
        expect(roots[0].hooks[0]).not.toHaveProperty('output')
    })
})
