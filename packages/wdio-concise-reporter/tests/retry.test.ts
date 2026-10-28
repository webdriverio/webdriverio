import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

vi.mock('chalk')
vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), 'packages/wdio-reporter/src/index.ts')))

import ConciseReporter from '../src/index.js'

const feature = { uid: 'f1', title: 'Feature', type: 'feature', file: '/a.feature', cid: '0-0' }
const scenario = { uid: 's1', title: 'Scenario', type: 'scenario', parent: 'f1', file: '/a.feature', cid: '0-0' }
const hook = (uid: string, title: string, kind: string, error?: Error) => ({
    uid, title, type: 'hook', parent: 's1', parentUid: 's1', hookKind: kind, cid: '0-0', error, state: error ? 'failed' : 'passed'
})
const step = (uid: string) => ({ uid, title: 'Given step', type: 'test', parent: 's1', cid: '0-0', file: '/a.feature' })

/** the Cucumber event order: the hook ends without `retried`, then `suite:retry` */
function run (failing: 'Before' | 'After', lastAttempt: boolean) {
    const reporter: any = new ConciseReporter({ stdout: true, writeStream: { write: () => true } as any })
    const out: string[] = []
    reporter.write = (chunk: unknown) => { out.push(String(chunk)) }
    const emit = (name: string, payload: unknown) => reporter.emit(name, payload)
    const attempt = (n: number, fails: boolean) => {
        const before = fails && failing === 'Before'
        const after = fails && failing === 'After'
        emit('hook:start', hook(`b${n}`, 'Before', 'beforeEach'))
        emit('hook:end', hook(`b${n}`, 'Before', 'beforeEach', before ? new Error('boom') : undefined))
        emit('test:start', step(`t${n}`))
        emit('test:pass', step(`t${n}`))
        emit('test:end', step(`t${n}`))
        emit('hook:start', hook(`a${n}`, 'After', 'afterEach'))
        emit('hook:end', hook(`a${n}`, 'After', 'afterEach', after ? new Error('boom') : undefined))
    }
    emit('runner:start', {
        cid: '0-0', capabilities: { browserName: 'chrome' }, specs: ['/a.feature'], sessionId: 'x',
        isMultiRemote: false, config: {}, instanceOptions: { '0-0': {} }
    })
    emit('suite:start', feature)
    emit('suite:start', scenario)
    attempt(1, true)
    emit('suite:retry', scenario)
    attempt(2, lastAttempt)
    emit('suite:end', scenario)
    emit('suite:end', feature)
    emit('runner:end', { cid: '0-0', failures: lastAttempt ? 1 : 0, retries: 1 })
    return out.join('')
}

describe('ConciseReporter with a retried Cucumber scenario', () => {
    it.each(['Before', 'After'] as const)('does not list a failed %s hook of a retried attempt', (failing) => {
        const output = run(failing, false)
        expect(output).not.toContain('Hook failed')
        expect(output).toContain('All went well!')
    })

    it.each(['Before', 'After'] as const)('still lists a %s hook that fails in the last attempt', (failing) => {
        const output = run(failing, true)
        expect(output).toContain('Hook failed (1)')
        expect(output).not.toContain('All went well!')
    })
})
