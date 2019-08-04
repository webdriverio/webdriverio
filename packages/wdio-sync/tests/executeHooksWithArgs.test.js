import executeHooksWithArgs from '../src/executeHooksWithArgs'

describe('executeHooksWithArgs', () => {
    it('multiple hooks, multiple args', async () => {
        const hookHoge = () => {return 'hoge'}
        const hookFuga = () => {return 'fuga'}
        const argHoge = {hoge: 'hoge'}
        const argFuga = {fuga: 'fuga'}
        const res = await executeHooksWithArgs([hookHoge, hookFuga], [argHoge, argFuga])
        expect(res).toHaveLength(2)
        expect(res).toContain('hoge')
        expect(res).toContain('fuga')
    })

    it('one hook, one arg', async () => {
        const hook = () => {return 'hoge'}
        const arg = {hoge: 'hoge'}
        const res = await executeHooksWithArgs(hook, arg)
        expect(res).toHaveLength(1)
        expect(res).toContain('hoge')
    })

    it('with error', async () => {
        const hook = () => {throw new Error('Hoge')}
        const res = await executeHooksWithArgs(hook, [])
        expect(res).toHaveLength(1)
        expect(res).toEqual([new Error('Hoge')])
    })

    it('return promise with error', async () => {
        const hook = () => {
            return new Promise(() => { throw new Error('Hoge') })
        }
        const res = await executeHooksWithArgs(hook, [])
        expect(res).toHaveLength(1)
        expect(res).toEqual([new Error('Hoge')])
    })
})
