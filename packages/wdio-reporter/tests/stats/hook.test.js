import HookStats from '../../src/stats/hook'

test('should get initialised', () => {
    const hook = new HookStats({
        cid: '0-0',
        title: 'foobar',
        parent: 'barfoo'
    })
    expect(hook.type).toBe('hook')
    expect(hook.cid).toBe('0-0')
    expect(hook.title).toBe('foobar')
    expect(hook.parent).toBe('barfoo')
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

test('should mark hook as failed if onComplete has error', () => {
    const hook = new HookStats({
        cid: '0-0',
        title: 'foobar',
        parent: 'barfoo'
    })
    const error = new Error('boom')
    hook.complete(error)
    expect(hook.error).toBe(error)
})
