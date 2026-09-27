import { describe, beforeEach, it, afterEach, expect, vi } from 'vitest'
import TestStats from '../../src/stats/test.js'

describe('RunnableStats', () => {
    let stat: TestStats

    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(3)
        stat = new TestStats({
            type: 'test:start',
            title: 'should can do something',
            parent: 'My awesome feature',
            fullTitle: 'My awesome feature should can do something',
            pending: false,
            cid: '0-0',
            specs: ['/path/to/test/specs/sync.spec.js'],
            uid: 'should can do something3',
            argument: { rows: [{ location: { column: 1, line: 1 }, value: 'hallo' } as any] }
        })
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('getIdentifier', () => {
        expect(TestStats.getIdentifier(stat)).toBe('should can do something3')
        stat.uid = ''
        expect(TestStats.getIdentifier(stat)).toBe('should can do something')
    })

    it('complete', () => {
        vi.setSystemTime(45)
        stat.complete()

        expect(stat.duration).toBe(42)
    })

    it('duration', () => {
        vi.setSystemTime(45)
        expect(stat.duration).toBe(42)
    })
})
