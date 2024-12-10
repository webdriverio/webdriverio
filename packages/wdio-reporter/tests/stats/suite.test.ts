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
