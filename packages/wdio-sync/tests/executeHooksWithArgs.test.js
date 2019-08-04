import executeHooksWithArgs from '../src/executeHooksWithArgs'

describe('executeHooksWithArgs', () => {
    it('multiple hooks, multiple args', async () => {
        const hookHoge = () => {return 'hoge'}
        const hookFuga = () => {return 'fuga'}
        const argHoge = {hoge: 'hoge'}
        const argFuga = {fuga: 'fuga'}
        const runCommand = executeHooksWithArgs([hookHoge, hookFuga], [argHoge, argFuga])
        expect(await runCommand).toHaveLength(2)
    })

    it('one hook, one arg', async () => {
        const hook = () => {return 'hoge'}
        const arg = {hoge: 'hoge'}
        const runCommand = executeHooksWithArgs(hook, arg)
        expect(await runCommand).toHaveLength(1)
    })
})
