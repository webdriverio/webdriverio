import { describe, expect, it } from 'vitest'

import RunnerStream from '../src/stdStream'
import { removeLastListener } from '../src/utils'

describe('removeLastListener', () => {
    it('should remove only last listener', () => {
        const stream = new RunnerStream()
        stream.on('foobar', () => {})
        stream.on('foobar', () => {})
        expect(stream.listeners('foobar')).toHaveLength(2)
        removeLastListener(stream, 'foobar')
        expect(stream.listeners('foobar')).toHaveLength(1)
    })

    it('should not fail if listener is missing', () => {
        const stream = new RunnerStream()
        removeLastListener(stream, 'foobar')
        expect(stream.listeners('foobar')).toHaveLength(0)
    })
})
