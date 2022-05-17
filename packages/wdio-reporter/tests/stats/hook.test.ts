import { test, expect } from 'vitest'
import HookStats from '../../src/stats/hook'

test('should get initialised', () => {
    const hook = new HookStats({
        cid: '0-0',
        title: 'foobar',
        parent: 'barfoo',
        currentTest: 'sometest'
    })
    expect(hook.type).toBe('hook')
    expect(hook.cid).toBe('0-0')
    expect(hook.title).toBe('foobar')
    expect(hook.parent).toBe('barfoo')
    expect(hook.currentTest).toBe('sometest')
})

test('should allow to be called complete', () => {
    const hook = new HookStats({
        cid: '0-0',
        title: 'foobar',
        parent: 'barfoo'
    })
    expect(typeof hook.end).toBe('undefined')
    hook.complete()
    expect(hook.end).toBeInstanceOf(Date)
})

test('should mark hook as failed if onComplete has errors', () => {
    const hook = new HookStats({
        cid: '0-0',
        title: 'foobar',
        parent: 'barfoo'
    })
    const errors = [new Error('boom')]
    hook.complete(errors)
    expect(hook.errors).toBe(errors)
    expect(hook.error!.message).toBe('boom')
    expect(hook.state).toBe('failed')
})

test('Should not mark hook as failed if onComplete has no errors', () => {
    const hook = new HookStats({
        cid: '0-0',
        title: 'foobar',
        parent: 'barfoo'
    })
    const errors: [] = []
    hook.complete(errors)
    expect(hook.errors).toBe(errors)
    expect(hook.error).toBeUndefined()
    expect(hook.state).not.toBe('failed')
})
