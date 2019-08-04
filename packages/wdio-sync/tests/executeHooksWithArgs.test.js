import executeHooksWithArgs from '../src/executeHooksWithArgs'

describe('executeHooksWithArgs', () => {
    it('should return', async () => {
        const hook = () => {return 'hoge'}
        const runCommand = executeHooksWithArgs(hook, [])
        expect(await runCommand).toEqual(['hoge'])
    })
})
