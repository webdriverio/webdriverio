import { describe, expect, it, beforeEach } from 'vitest'
import tmp from 'tmp'

import WDIOReporter from '../src/index.js'

const suite = (uid: string, title: string, parentUid?: string) => ({
    type: 'suite', uid, title, fullTitle: title, cid: '0-0', file: '/a.spec.js', ...(parentUid ? { parent: 'p', parentUid } : {})
})
const test = (uid: string, title: string, parentUid?: string) => ({
    type: 'test', uid, title, fullTitle: title, cid: '0-0', ...(parentUid ? { parentUid } : {})
})

describe('tree helpers', () => {
    let reporter: WDIOReporter

    beforeEach(() => {
        reporter = new WDIOReporter({ logFile: tmp.fileSync().name })
    })

    it('gives depth and path of a sequential nesting A > B > C', () => {
        reporter.emit('suite:start', suite('a', 'A'))
        reporter.emit('test:start', test('t1', 'in A'))
        reporter.emit('suite:start', suite('b', 'B'))
        reporter.emit('suite:start', suite('c', 'C'))
        reporter.emit('test:start', test('t3', 'in C'))

        const inC = reporter.tests.t3
        expect(reporter.depthOf(inC)).toBe(3)
        expect(reporter.pathOf(inC).map((s) => s.title)).toEqual(['A', 'B', 'C'])
        expect(reporter.parentOf(inC)).toBe(reporter.suites.c)
        expect(reporter.depthOf(reporter.tests.t1)).toBe(1)
        expect(reporter.depthOf(reporter.suites.c)).toBe(2)
        expect(reporter.pathOf(reporter.suites.c).map((s) => s.title)).toEqual(['A', 'B'])
    })

    it('gives the same values for parallel payloads with parentUid and interleaved tests', () => {
        reporter.emit('suite:start', suite('a', 'A'))
        reporter.emit('suite:start', suite('b', 'B', 'a'))
        reporter.emit('suite:start', suite('c', 'C', 'b'))
        reporter.emit('test:start', test('t1', 'in C', 'c'))
        reporter.emit('test:start', test('t2', 'in A', 'a'))
        reporter.emit('hook:start', { type: 'hook', uid: 'h1', title: 'hook', parentUid: 'b' })

        expect(reporter.depthOf(reporter.tests.t1)).toBe(3)
        expect(reporter.pathOf(reporter.tests.t1).map((s) => s.title)).toEqual(['A', 'B', 'C'])
        expect(reporter.depthOf(reporter.tests.t2)).toBe(1)
        expect(reporter.parentOf(reporter.hooks.h1)).toBe(reporter.suites.b)
        expect(reporter.depthOf(reporter.hooks.h1)).toBe(2)
    })

    it('gives no parent and depth 0 for a root-level test', () => {
        reporter.emit('test:start', test('t0', 'root test'))

        expect(reporter.parentOf(reporter.tests.t0)).toBeUndefined()
        expect(reporter.pathOf(reporter.tests.t0)).toEqual([])
        expect(reporter.depthOf(reporter.tests.t0)).toBe(0)
    })

    it('records the parent of a pending test that never started', () => {
        reporter.emit('suite:start', suite('a', 'A'))
        reporter.emit('test:pending', { ...test('p1', 'skipped', 'a'), state: 'pending' })

        expect(reporter.parentOf(reporter.tests.p1)).toBe(reporter.suites.a)
    })
})
