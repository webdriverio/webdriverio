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

test('clearAttempt() starts the next attempt now', () => {
    const suite = new SuiteStats({ title: 'foobar', fullTitle: 'barfoo', file: '/this/is/a/file.txt' })
    suite.start = new Date(0)
    suite.retries = 1
    suite.clearAttempt()
    expect(suite.start.getTime()).toBeGreaterThan(0)
    expect(suite.retries).toBe(1)
})
