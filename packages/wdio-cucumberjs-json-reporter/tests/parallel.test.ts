import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import CucumberJsJsonReporter from '../src/index.js'
import type { Feature, Step } from '../src/types.js'

const FEATURE_TEXT = [
    'Feature: Parallel',
    '',
    '  Scenario: A',
    '    Given a one',
    '    Then a two',
    '',
    '  Scenario: B',
    '    Given b one',
    '',
].join('\n')

describe('cucumberOpts.parallelMode: one state for each scenario (R5)', () => {
    let folder: string
    let featureFile: string
    let reporter: CucumberJsJsonReporter
    let context: string | undefined
    let warn: ReturnType<typeof vi.spyOn>

    const emit = (type: string, payload: Record<string, unknown>) =>
        reporter.emit(type, { type, cid: '0-0', specs: [featureFile], ...payload })
    const scenario = (uid: string, contextId: string) =>
        emit('suite:start', { uid, title: uid, type: 'scenario', parent: 'Parallel', parentUid: 'f', file: featureFile, contextId })
    // Cucumber sends no contextId on the end of a hook or a scenario
    const scenarioEnd = (uid: string) => emit('suite:end', { uid, title: uid, type: 'scenario', parent: 'Parallel', parentUid: 'f', file: featureFile })
    const step = (event: string, uid: string, title: string, parent: string, contextId: string, state?: string) =>
        emit(event, { uid, title, fullTitle: `${parent}: ${title}`, parent, parentUid: parent, file: featureFile, contextId, ...(state && { state }) })
    const passStep = (uid: string, title: string, parent: string, contextId: string) => {
        step('test:pass', uid, title, parent, contextId, 'passed')
        step('test:end', uid, title, parent, contextId, 'passed')
    }
    const hookStart = (uid: string, title: string, parent: string, contextId: string, hookKind: string) =>
        emit('hook:start', { uid, title, parent, parentUid: parent, file: featureFile, contextId, hookKind })
    const hookEnd = (uid: string, title: string, parent: string, hookKind: string) =>
        emit('hook:end', { uid, title, parent, parentUid: parent, file: featureFile, state: 'PASSED', hookKind })
    const attach = (contextId: string | undefined, text: string) => {
        context = contextId
        reporter.cucumberJsAttachment({ data: text, type: 'text/plain' })
        context = undefined
    }
    const start = () => {
        emit('runner:start', { capabilities: { browserName: 'chrome' }, config: {}, sessionId: 's', instanceOptions: {} })
        emit('suite:start', { uid: 'f', title: 'Parallel', type: 'feature', file: featureFile, parentUid: null })
    }
    const end = () => {
        emit('suite:end', { uid: 'f', title: 'Parallel', type: 'feature', file: featureFile, parentUid: null })
        emit('runner:end', { failures: 0, retries: 0 })
    }
    const writtenFeature = (): Feature => {
        const file = fs.readdirSync(folder).find((name) => name.endsWith('.json'))!
        return JSON.parse(fs.readFileSync(path.join(folder, file), 'utf-8'))[0]
    }
    const stepView = (s: Step) => [
        s.hidden ? `(${s.keyword})` : `${s.keyword.trim()} ${s.name}@${s.line}`,
        s.result.status,
        ...(s.embeddings ?? []).map((e) => Buffer.from(e.data as string, 'base64').toString()),
    ].join(' ')
    const view = (feature: Feature) => feature.elements!.map((e) => ({ name: e.name, line: e.line, steps: e.steps!.map(stepView) }))

    beforeEach(() => {
        folder = fs.mkdtempSync(path.join(os.tmpdir(), 'cjson-parallel-'))
        featureFile = path.join(folder, 'parallel.feature')
        fs.writeFileSync(featureFile, FEATURE_TEXT)
        reporter = new CucumberJsJsonReporter({ jsonFolder: path.join(folder, 'json'), logFile: path.join(folder, 'log') } as never)
        context = undefined
        reporter.setContextIdResolver(() => context)
        reporter.instanceMetadata = {} as never
        warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        folder = path.join(folder, 'json')
    })

    afterEach(() => {
        warn.mockRestore()
    })

    it('keeps the steps, hooks, lines and attachments of 2 overlapping scenarios in their own scenario', () => {
        start()
        scenario('A', 'ca')
        scenario('B', 'cb')
        // B has no step yet: the attachment waits for the first step of B
        attach('cb', 'waits in B')
        hookStart('ha1', 'Before', 'A', 'ca', 'beforeEach')
        step('test:start', 'b1', 'Given b one', 'B', 'cb')
        hookEnd('ha1', 'Before', 'A', 'beforeEach')
        step('test:start', 'a1', 'Given a one', 'A', 'ca')
        attach('ca', 'of a one')
        passStep('b1', 'Given b one', 'B', 'cb')
        attach('cb', 'of b one')
        passStep('a1', 'Given a one', 'A', 'ca')
        step('test:start', 'a2', 'Then a two', 'A', 'ca')
        hookStart('hb2', 'After', 'B', 'cb', 'afterEach')
        hookEnd('hb2', 'After', 'B', 'afterEach')
        scenarioEnd('B')
        emit('context:end', { uid: 'b1', contextId: 'cb' })
        passStep('a2', 'Then a two', 'A', 'ca')
        hookStart('ha2', 'After', 'A', 'ca', 'afterEach')
        hookEnd('ha2', 'After', 'A', 'afterEach')
        scenarioEnd('A')
        emit('context:end', { uid: 'a2', contextId: 'ca' })
        end()

        expect(view(writtenFeature())).toEqual([
            { name: 'A', line: 3, steps: ['(Before) passed', 'Given a one@4 passed of a one', 'Then a two@5 passed', '(After) passed'] },
            { name: 'B', line: 7, steps: ['Given b one@8 passed waits in B of b one', '(After) passed'] },
        ])
    })

    it('does not move the waiting attachments of a scenario that ends with no step to another scenario', () => {
        start()
        scenario('A', 'ca')
        scenario('B', 'cb')
        attach('ca', 'of A')
        step('test:start', 'b1', 'Given b one', 'B', 'cb')
        passStep('b1', 'Given b one', 'B', 'cb')
        scenarioEnd('A')
        emit('context:end', { uid: 'A', contextId: 'ca' })
        scenarioEnd('B')
        emit('context:end', { uid: 'b1', contextId: 'cb' })
        end()

        expect(view(writtenFeature())).toEqual([
            { name: 'A', line: 3, steps: [] },
            { name: 'B', line: 7, steps: ['Given b one@8 passed'] },
        ])
    })

    it('starts the steps of the retried scenario again, not of the scenario that started last', () => {
        start()
        scenario('A', 'ca')
        scenario('B', 'cb')
        step('test:start', 'a1', 'Given a one', 'A', 'ca')
        step('test:retry', 'a1', 'Given a one', 'A', 'ca', 'failed')
        step('test:end', 'a1', 'Given a one', 'A', 'ca', 'failed')
        step('test:start', 'b1', 'Given b one', 'B', 'cb')
        emit('suite:retry', { uid: 'A', title: 'A', type: 'scenario', parent: 'Parallel', parentUid: 'f', file: featureFile, contextId: 'ca' })
        step('test:start', 'a1', 'Given a one', 'A', 'ca')
        passStep('a1', 'Given a one', 'A', 'ca')
        passStep('b1', 'Given b one', 'B', 'cb')
        scenarioEnd('A')
        scenarioEnd('B')
        end()

        expect(view(writtenFeature())).toEqual([
            { name: 'A', line: 3, steps: ['Given a one@4 passed'] },
            { name: 'B', line: 7, steps: ['Given b one@8 passed'] },
        ])
    })

    it('keeps the lines and the language of the feature file of each scenario', () => {
        const frenchFile = path.join(path.dirname(featureFile), 'french.feature')
        fs.writeFileSync(frenchFile, '# language: fr\nFonctionnalité: Français\n\n  Scénario: C\n    Soit c un\n')
        start()
        scenario('A', 'ca')
        emit('suite:start', { uid: 'f2', title: 'Français', type: 'feature', file: frenchFile, parentUid: null })
        emit('suite:start', { uid: 'C', title: 'C', type: 'scenario', parent: 'Français', parentUid: 'f2', file: frenchFile, contextId: 'cc' })
        step('test:start', 'a1', 'Given a one', 'A', 'ca')
        passStep('a1', 'Given a one', 'A', 'ca')
        emit('test:start', { uid: 'c1', title: 'Soit c un', parent: 'C', parentUid: 'C', file: frenchFile, contextId: 'cc' })
        emit('test:pass', { uid: 'c1', title: 'Soit c un', parent: 'C', parentUid: 'C', file: frenchFile, contextId: 'cc', state: 'passed' })
        scenarioEnd('A')
        emit('suite:end', { uid: 'C', title: 'C', type: 'scenario', parent: 'Français', parentUid: 'f2', file: frenchFile })
        emit('suite:end', { uid: 'f2', title: 'Français', type: 'feature', file: frenchFile, parentUid: null })
        end()

        const features = fs.readdirSync(folder).map((name) => JSON.parse(fs.readFileSync(path.join(folder, name), 'utf-8'))[0] as Feature)
        expect(features.map((feature) => view(feature)).sort((a, b) => a[0].name!.localeCompare(b[0].name!))).toEqual([
            [{ name: 'A', line: 3, steps: ['Given a one@4 passed'] }],
            [{ name: 'C', line: 4, steps: ['Soit c un@5 passed'] }],
        ])
    })

    it('prints no warning for scenarios that run at the same time', () => {
        start()
        scenario('A', 'ca')
        scenario('B', 'cb')
        scenarioEnd('A')
        scenarioEnd('B')
        end()

        expect(warn.mock.calls.flat().join('\n')).not.toContain('at the same time')
    })
})

describe('a hook of the feature (failed Cucumber BeforeAll / AfterAll)', () => {
    let folder: string
    let reporter: CucumberJsJsonReporter
    const featureFile = '/parallel.feature'

    const emit = (type: string, payload: Record<string, unknown>) =>
        reporter.emit(type, { type, cid: '0-0', specs: [featureFile], ...payload })
    const featureHook = (title: string, hookKind: string) => {
        const hook = { uid: `${title}-1`, title, parent: 'f', parentUid: 'f', hookSuiteUid: 'f', hookKind, file: featureFile }
        emit('hook:start', hook)
        emit('hook:end', { ...hook, state: 'FAILED', error: { message: `${title} fails`, stack: `${title} fails` } })
    }

    beforeEach(() => {
        folder = fs.mkdtempSync(path.join(os.tmpdir(), 'cjson-feature-hook-'))
        reporter = new CucumberJsJsonReporter({ jsonFolder: folder, logFile: path.join(folder, 'log') } as never)
        reporter.instanceMetadata = {} as never
        emit('runner:start', { capabilities: { browserName: 'chrome' }, config: {}, sessionId: 's', instanceOptions: {} })
        emit('suite:start', { uid: 'f', title: 'Parallel', type: 'feature', file: featureFile, parentUid: null })
    })

    it('does not throw for a BeforeAll before the first scenario', () => {
        expect(() => featureHook('BeforeAll', 'beforeAll')).not.toThrow()
    })

    it('is not a step of the last scenario (AfterAll)', () => {
        emit('suite:start', { uid: 'A', title: 'A', type: 'scenario', parent: 'Parallel', parentUid: 'f', file: featureFile })
        emit('test:start', { uid: 'a1', title: 'Given a one', parent: 'A', parentUid: 'A', file: featureFile })
        emit('test:pass', { uid: 'a1', title: 'Given a one', parent: 'A', parentUid: 'A', file: featureFile, state: 'passed' })
        emit('test:end', { uid: 'a1', title: 'Given a one', parent: 'A', parentUid: 'A', file: featureFile, state: 'passed' })
        emit('suite:end', { uid: 'A', title: 'A', type: 'scenario', parent: 'Parallel', parentUid: 'f', file: featureFile })
        featureHook('AfterAll', 'afterAll')

        expect(reporter.report.feature!.elements!.map((e) => e.steps!.map((s) => `${s.keyword.trim()} ${s.name ?? ''} ${s.result.status}`)))
            .toEqual([['Given a one passed']])
    })
})
