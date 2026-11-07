import path from 'node:path'
import url from 'node:url'
import { test, expect } from 'vitest'
import SuiteStats from '../../src/stats/suite.js'

test('should get initialized', () => {
    const suite = new SuiteStats({
        cid: '0-0',
        title: 'foobar',
        fullTitle: 'barfoo',
        file: '/this/is/a/file.txt',
        description: 'some description',
        tags: ['foo', 'bar'],
        parent: 'foobar'
    })

    const { start, ...snapshot } = suite
    expect(snapshot).toMatchSnapshot()
    expect(start instanceof Date).toBe(true)
})

test('keeps the parent and the context of a parallel suite', () => {
    const topLevel = new SuiteStats({ title: 'feature', fullTitle: 'feature', file: 'a.feature', parentUid: null })
    const scenario = new SuiteStats({
        type: 'scenario', title: 'scenario', fullTitle: 'scenario', file: 'a.feature', parentUid: 'feature-1', contextId: 'ctx-1'
    })

    expect(topLevel.parentUid).toBeNull()
    expect(scenario.parentUid).toBe('feature-1')
    expect(scenario.contextId).toBe('ctx-1')
})

test('should allow to retry suite', () => {
    const suite = new SuiteStats({
        cid: '0-0',
        title: 'foobar',
        fullTitle: 'barfoo',
        file: '/this/is/a/file.txt',
        description: 'some description',
        tags: ['foo', 'bar'],
        parent: 'foobar'
    })
    suite.tests = [1, 2, 3] as any
    suite.hooks = [4, 5, 6] as any
    suite.hooksAndTests = [7, 8, 9] as any
    suite.retry()
    expect(suite.retries).toBe(1)
    expect(suite.tests).toHaveLength(0)
    expect(suite.hooks).toHaveLength(0)
    expect(suite.hooksAndTests).toHaveLength(0)
})

test('retry() keeps the start of the suite, as main', () => {
    const suite = new SuiteStats({ title: 'foobar', fullTitle: 'barfoo', file: '/this/is/a/file.txt' })
    const start = new Date(0)
    suite.start = start
    suite.retry()
    expect(suite.start).toBe(start)
})

test('clearAttempt() keeps the start of the first attempt, as main', () => {
    const suite = new SuiteStats({ title: 'foobar', fullTitle: 'barfoo', file: '/this/is/a/file.txt' })
    const start = new Date(0)
    suite.start = start
    suite.retries = 1
    suite.tests = [1] as any
    suite.clearAttempt()
    expect(suite.start).toBe(start)
    expect(suite.tests).toHaveLength(0)
    expect(suite.retries).toBe(1)
})

test('takes no root mark from the payload', () => {
    expect('isRoot' in new SuiteStats({ title: 'foobar', fullTitle: 'foobar', file: '/a.spec.js', isRoot: true } as never)).toBe(false)
})

// Jasmine gives the file of an ESM spec as a URL, the base reporter the URL of the runner for a suite with none
test('keeps the spec file of a suite as a path', () => {
    const file = path.resolve('specs', 'a.spec.mjs')
    expect(new SuiteStats({ title: 'foobar', fullTitle: 'foobar', file: url.pathToFileURL(file).href }).file).toBe(file)
    expect(new SuiteStats({ title: 'foobar', fullTitle: 'foobar', file: 'unknown spec file' }).file).toBe('unknown spec file')
})

test('ignores a suite file that is not a text', () => {
    expect(new SuiteStats({ title: 'foobar', fullTitle: 'foobar', file: new URL('file:///a.spec.js') as never }).file).toBeUndefined()
})
