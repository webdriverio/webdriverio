import { describe, expect, test, beforeEach, vi, SpyInstance, afterEach } from 'vitest'
import RunnerStream from '../src/stdStream'

describe('RunnerStream', () => {
    let stream: RunnerStream
    let pushSpy: SpyInstance

    const cb = vi.fn()
    beforeEach(() => {
        stream = new RunnerStream()
        pushSpy = vi.spyOn(stream, 'push')
    })

    test('should have pipe listener', () => {
        stream._transform('foobar', 'utf8', cb)
        expect(cb).toBeCalledWith(undefined, 'foobar')
    })

    test('should remove certain last listener on pipe', () => {
        const stream2 = new RunnerStream()
        stream.on('foobar', () => {})
        stream.on('error', () => {})
        stream2.pipe(stream)

        expect(stream.listeners('foobar')).toHaveLength(1)
        expect(stream.listeners('error')).toHaveLength(1)
        expect(stream.listeners('close')).toHaveLength(0)
        expect(stream.listeners('drain')).toHaveLength(0)
        expect(stream.listeners('finish')).toHaveLength(0)
        expect(stream.listeners('unpipe')).toHaveLength(0)
    })

    afterEach(() => {
        cb.mockClear()
        pushSpy.mockClear()
        return new Promise((resolve) => stream.end(() => resolve()))
    })
})
