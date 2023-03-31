import { describe, beforeEach, it, afterEach, expect, vi } from 'vitest'
import TestStats from '../../src/stats/test.js'

describe('RunnableStats', () => {
    let stat: TestStats
    const DateOrig = Date

    beforeEach(() => {
        global.Date = vi.fn() as any
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
        global.Date = DateOrig
    })

    it('getIdentifier', () => {
        expect(TestStats.getIdentifier(stat)).toBe('should can do something3')
        stat.uid = ''
        expect(TestStats.getIdentifier(stat)).toBe('should can do something')
    })

    it('complete', () => {
        stat.start = { getTime: vi.fn().mockReturnValue(3) } as any
        global.Date = vi.fn().mockReturnValue({
            getTime: () => 45
        }) as any
        stat.complete()

        expect(stat.duration).toBe(42)
    })

    it('duration', () => {
        stat.start = { getTime: vi.fn().mockReturnValue(3) } as any
        global.Date = vi.fn().mockReturnValue({
            getTime: () => 45
        }) as any
        expect(stat.duration).toBe(42)
    })
})
