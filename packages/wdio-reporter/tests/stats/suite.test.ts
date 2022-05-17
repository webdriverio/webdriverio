import { test, expect } from 'vitest'
import SuiteStats from '../../src/stats/suite'

test('should get initialised', () => {
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
