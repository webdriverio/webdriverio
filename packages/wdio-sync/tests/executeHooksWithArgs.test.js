import executeHooksWithArgs from '../src/executeHooksWithArgs'

describe('executeHooksWithArgs', () => {
    beforeEach(() => {
        global.browser = {}
    })

    it('multiple hooks, multiple args', async () => {
        const hookHoge = () => { return 'hoge' }
        const hookFuga = () => { return 'fuga' }
        const argHoge = { hoge: 'hoge' }
        const argFuga = { fuga: 'fuga' }
        const res = await executeHooksWithArgs([hookHoge, hookFuga], [argHoge, argFuga])
        expect(res).toEqual(['hoge', 'fuga'])
    })

    it('one hook, one arg', async () => {
        const hook = () => { return 'hoge' }
        const arg = { hoge: 'hoge' }
        const res = await executeHooksWithArgs(hook, arg)
        expect(res).toHaveLength(1)
        expect(res).toContain('hoge')
    })

    it('with error', async () => {
        const hook = () => { throw new Error('Hoge') }
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

    it('async functions', async () => {
        global.browser._NOT_FIBER = true
        const hookHoge = () => {
            return new Promise(reject => setTimeout(reject, 5, new Error('Hoge')))
        }
        const hookFuga = async () => new Promise(resolve => setTimeout(resolve, 10, 'fuga'))
        const res = await executeHooksWithArgs([hookHoge, hookFuga], [])
        expect(res).toEqual([new Error('Hoge'), 'fuga'])
        expect(global.browser._NOT_FIBER).toBe(undefined)
    })

    it('should do nothing if there were no hooks passed', async () => {
        const res = await executeHooksWithArgs()
        expect(res).toHaveLength(0)
    })

    afterEach(() => {
        delete global.browser
    })
})
