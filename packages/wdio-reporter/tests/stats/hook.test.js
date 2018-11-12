import HookStats from '../../src/stats/hook'

test('should get initialised', () => {
    const hook = new HookStats({
        cid: '0-0',
        title: 'foobar',
        parent: 'barfoo',
        parentUid: '123'
    })
    expect(hook.type).toBe('hook')
    expect(hook.cid).toBe('0-0')
    expect(hook.title).toBe('foobar')
    expect(hook.parent).toBe('barfoo')
    expect(hook.parentUid).toBe('123')
})
