import { describe, expect, it, vi } from 'vitest'

import DotReporter from '../src/index.js'

vi.mock('chalk')

// the real base reporter: its stats and tree, from the events that the frameworks send
const newReporter = () => {
    const reporter = new DotReporter({ writeStream: { write: vi.fn() } } as never)
    reporter.write = vi.fn()
    return reporter
}
const dots = (reporter: DotReporter) => vi.mocked(reporter.write).mock.calls.map(([dot]) => dot)

const suite = (uid: string, type: string, parentUid?: string | null) => ({
    uid, title: uid, type, cid: '0-0', file: '/spec.js', ...(parentUid !== undefined && { parentUid })
})
const step = (uid: string, parentUid: string) => ({ uid, title: uid, type: 'test', cid: '0-0', fullTitle: uid, parentUid })
const hook = (title: string, parentUid: string, hookKind: string) => ({ uid: `${title}-hook`, title, type: 'hook', cid: '0-0', parent: parentUid, parentUid, hookKind })

describe('dot reporter hook of a feature (K26)', () => {
    it('writes an F for a failed Cucumber BeforeAll of the feature', () => {
        const reporter = newReporter()
        reporter.emit('suite:start', suite('F', 'feature', null))
        reporter.emit('hook:start', hook('BeforeAll', 'F', 'beforeAll'))
        reporter.emit('hook:end', { ...hook('BeforeAll', 'F', 'beforeAll'), error: { message: 'BeforeAll fails' } })
        reporter.emit('suite:start', suite('S1', 'scenario', 'F'))
        reporter.emit('test:start', step('step-1', 'S1'))
        reporter.emit('test:skip', step('step-1', 'S1'))
        reporter.emit('test:end', step('step-1', 'S1'))
        reporter.emit('suite:end', suite('S1', 'scenario'))
        expect(() => reporter.emit('suite:end', suite('F', 'feature'))).not.toThrow()
        expect(dots(reporter)).toEqual(['redBright F', 'cyanBright .'])
    })

    it('writes an F for a failed Cucumber AfterAll of the feature after its scenarios', () => {
        const reporter = newReporter()
        reporter.emit('suite:start', suite('F', 'feature', null))
        reporter.emit('suite:start', suite('S1', 'scenario', 'F'))
        reporter.emit('test:start', step('step-1', 'S1'))
        reporter.emit('test:pass', step('step-1', 'S1'))
        reporter.emit('test:end', step('step-1', 'S1'))
        reporter.emit('suite:end', suite('S1', 'scenario'))
        reporter.emit('hook:start', hook('AfterAll', 'F', 'afterAll'))
        reporter.emit('hook:end', { ...hook('AfterAll', 'F', 'afterAll'), error: { message: 'AfterAll fails' } })
        reporter.emit('suite:end', suite('F', 'feature'))
        expect(dots(reporter)).toEqual(['greenBright .', 'redBright F'])
    })

    it('writes nothing for a passed hook of the feature or a failed hook of a Mocha suite (no change)', () => {
        const reporter = newReporter()
        reporter.emit('suite:start', suite('F', 'feature', null))
        reporter.emit('hook:start', hook('BeforeAll', 'F', 'beforeAll'))
        reporter.emit('hook:end', hook('BeforeAll', 'F', 'beforeAll'))
        reporter.emit('suite:end', suite('F', 'feature'))
        reporter.emit('suite:start', suite('s', 'suite', null))
        reporter.emit('hook:start', hook('"after all" hook', 's', 'afterAll'))
        reporter.emit('hook:end', { ...hook('"after all" hook', 's', 'afterAll'), error: { message: 'fails' } })
        reporter.emit('suite:end', suite('s', 'suite'))
        expect(dots(reporter)).toEqual([])
    })
})
