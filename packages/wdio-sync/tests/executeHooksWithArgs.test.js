import executeHooksWithArgs from '../src/executeHooksWithArgs'

describe('executeHooksWithArgs', () => {
    it('multiple hooks, multiple args', async () => {
        const hookHoge = () => {return 'hoge'}
        const hookFuga = () => {return 'fuga'}
        const argHoge = {hoge: 'hoge'}
        const argFuga = {fuga: 'fuga'}
        const res = await executeHooksWithArgs([hookHoge, hookFuga], [argHoge, argFuga])
        expect(res).toHaveLength(2)
    })

    it('one hook, one arg', async () => {
        const hook = () => {return 'hoge'}
        const arg = {hoge: 'hoge'}
        const res = await executeHooksWithArgs(hook, arg)
        expect(res).toEqual(['hoge'])
    })

    it('with error', async () => {
        const hook = () => {throw new Error('Fuga')}
        const res = await executeHooksWithArgs(hook, [])
        expect(res).toEqual([new Error('Fuga')])
    })

    it('return promise', async () => {
        const hook = () => {
            return new Promise((resolve) => { resolve('Hello') })
        }
        const res = await executeHooksWithArgs(hook, [])
        expect(res).toEqual(new Promise(() => { resolve('Hello') }))
    })
})
