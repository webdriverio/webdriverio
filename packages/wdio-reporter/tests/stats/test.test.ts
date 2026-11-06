import { describe, expect, vi, it, beforeEach } from 'vitest'

import { AssertionError } from 'node:assert'
import path from 'node:path'
import url from 'node:url'
import TestStats from '../../src/stats/test.js'

describe('TestStats', () => {
    let stat: TestStats

    beforeEach(() => {
        stat = new TestStats({
            type: 'test:start',
            title: 'should can do something',
            parent: 'My awesome feature',
            fullTitle: 'My awesome feature should can do something',
            pending: false,
            cid: '0-0',
            specs: ['/path/to/test/specs/sync.spec.js'],
            uid: 'should can do something3',
            argument: { rows: [{ cells: ['hello'] }] }
        })
    })

    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('keeps the context and the parent of a parallel test', () => {
        const parallel = new TestStats({
            type: 'test:start', title: 'a', parent: 'suite', fullTitle: 'suite a', pending: false,
            cid: '0-0', specs: [], uid: 'test-0-0-0', contextId: 'ctx-1', parentUid: 'suite-1'
        })

        expect(parallel.contextId).toBe('ctx-1')
        expect(parallel.parentUid).toBe('suite-1')
    })

    it('keeps the null parent of a top-level parallel test', () => {
        const topLevel = new TestStats({
            type: 'test:start', title: 'a', parent: '', fullTitle: 'a', pending: false,
            cid: '0-0', specs: [], uid: 'test-0-0-1', contextId: 'ctx-1', parentUid: null
        })

        expect(topLevel.parentUid).toBeNull()
    })

    it('adds no context or parent property when the payload has none', () => {
        expect(Object.keys(stat)).not.toContain('contextId')
        expect(Object.keys(stat)).not.toContain('parentUid')
    })

    it('keeps the spec file of the test only when the payload has it', () => {
        expect('file' in stat).toBe(false)
        const withFile = new TestStats({
            type: 'test:start', title: 'a', parent: '', fullTitle: 'a', pending: false,
            cid: '0-0', specs: [], uid: 'test-0-0-2', file: '/specs/b.spec.js'
        })
        expect(withFile.file).toBe('/specs/b.spec.js')
    })

    it('keeps no spec file that is not a text', () => {
        for (const file of [null, 1, '']) {
            const withValue = new TestStats({
                type: 'test:start', title: 'a', parent: '', fullTitle: 'a', pending: false,
                cid: '0-0', specs: [], uid: 'test-0-0-4', file: file as never
            })
            expect('file' in withValue).toBe(false)
        }
    })

    // Jasmine gives the file of an ESM spec as a URL, Mocha parallel mode the URL of the runner
    it('keeps the spec file of the test as a path', () => {
        const file = path.resolve('specs', 'b.spec.js')
        const withUrl = new TestStats({
            type: 'test:start', title: 'a', parent: '', fullTitle: 'a', pending: false,
            cid: '0-0', specs: [], uid: 'test-0-0-3', file: url.pathToFileURL(file).href
        })
        expect(withUrl.file).toBe(file)
    })

    it('completes at a given end instead of now', () => {
        stat.complete(new Date(100))

        expect(stat.end!.getTime()).toBe(100)
        expect(stat.duration).toBe(100 - stat.start.getTime())
    })

    it('defines a start date', () => {
        expect(stat.type).toBe('test')
        expect(stat.start instanceof Date).toBe(true)
    })

    it('should be initialized with correct values', () => {
        stat.complete = vi.fn()

        expect(stat.type).toBe('test')
        expect(stat.cid).toBe('0-0')
        expect(stat.argument).toEqual({ rows: [{ cells: ['hello'] }] })
        expect(stat.uid).toBe('should can do something3')
        expect(stat.state).toBe('pending')
    })

    it('can get skipped', () => {
        stat.complete = vi.fn()
        stat.skip('for no reason')

        expect(stat.state).toBe('skipped')
        expect(stat.pendingReason).toBe('for no reason')
        expect(vi.mocked(stat.complete).mock.calls).toHaveLength(0)
    })

    it('can pass', () => {
        stat.complete = vi.fn()
        stat.pass()

        expect(stat.state).toBe('passed')
        expect(vi.mocked(stat.complete).mock.calls).toHaveLength(1)
    })

    it('can fail', () => {
        stat.complete = vi.fn()
        stat.fail([new Error('oh oh')])

        expect(stat.state).toBe('failed')
        expect(stat.errors!.length).toBe(1)
        expect(stat.errors![0].message).toBe('oh oh')

        expect(stat.error!.message).toBe('oh oh')
        expect(vi.mocked(stat.complete).mock.calls).toHaveLength(1)
    })

    it('should not throw if it fails with no errors somehow', () => {
        stat.complete = vi.fn()
        stat.fail([])

        expect(stat.errors!.length).toBe(0)
        expect(stat.state).toBe('failed')
    })

    it('should not throw if it fails with undefined errors somehow', () => {
        stat.complete = vi.fn()
        stat.fail(undefined)

        expect(stat.state).toBe('failed')
    })

    it('should show diff of error', () => {
        stat.fail([new AssertionError({ message: 'foobar', actual: 'true', expected: 'false' })])
        expect(stat.error?.message).toContain('actual')
        expect(stat.error?.message).toContain('expected')
    })

    it('preserves assertion fields and serializes them', () => {
        stat.fail([new AssertionError({ message: 'foobar', actual: 1, expected: 2, operator: 'strictEqual' })])
        const error = stat.error as AssertionError
        expect(error.name).toBe('AssertionError')
        expect(error.actual).toBe(1)
        expect(error.expected).toBe(2)
        expect(error.operator).toBe('strictEqual')
        expect(JSON.parse(JSON.stringify(error))).toMatchObject({
            name: 'AssertionError',
            message: expect.stringContaining('foobar'),
            actual: 1,
            expected: 2,
            operator: 'strictEqual'
        })
    })

    it('keeps the diff for Mocha-style errors with an enumerable message', () => {
        const error = {
            name: 'AssertionError',
            message: 'grew unbounded',
            stack: 'at test',
            actual: 'a',
            expected: 'b',
            operator: 'strictEqual'
        }
        stat.fail([error as any])
        expect(stat.error?.message).toContain('grew unbounded')
        expect(stat.error?.message).toContain('actual')
        expect(stat.error?.actual).toBe('a')
        expect(stat.error?.expected).toBe('b')
    })

    it('should not diff if "actual" and "expected" are empty', () => {
        stat.fail([new AssertionError({ message: 'foobar', actual: '', expected: '' })])
        expect(stat.error?.message).not.toContain('actual')
        expect(stat.error?.message).not.toContain('expected')
    })

    it('should not diff if error is already diffed', () => {
        const error = new AssertionError({ message: 'foobar\nExpected: foo\nReceived: bar42', actual: 'true', expected: 'false' })
        const message = error.message
        stat.fail([error])
        expect(stat.error?.message).toBe(message)
    })

    it('does not diff assertion errors whose actual value is a Proxy', () => {
        const error = new AssertionError({
            message: 'Expect $(`#flash`) to be existing\n\nExpected \u001b[32m"existing"\u001b[39m\nReceived \u001b[31m"\u001b[7mnot \u001b[27mexisting"\u001b[39m',
            expected: 'hi',
            actual: new Proxy(new Promise(()=>{}), {})
        })
        const message = error.message
        stat.fail([error])
        expect(stat.error?.message).toBe(message)
    })

    it('still diffs WebdriverIO expect errors that are not already formatted', () => {
        const error = new AssertionError({
            message: 'Expect $(`#flash`) to be existing\n\nExpected \u001b[32m"existing"\u001b[39m\nReceived \u001b[31m"\u001b[7mnot \u001b[27mexisting"\u001b[39m',
            expected: 'hi',
            actual: 'false'
        })
        const message = error.message
        stat.fail([error])
        expect(stat.error?.message).not.toBe(message)
        expect(stat.error?.message).toContain(message)
        expect(stat.error?.message).toContain('actual')
    })

    it('has no own retried property until a retry marks it', () => {
        expect(Object.prototype.hasOwnProperty.call(stat, 'retried')).toBe(false)
    })
})
