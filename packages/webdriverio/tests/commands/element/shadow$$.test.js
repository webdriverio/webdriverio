import { remote } from '../../../src'

describe('shadow$$', () => {
    it('should call $$ with a function selector', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const el = await browser.$('#foo')
        // this is wacky, but I'm not all that familiar with jest.
        // if I tried to spyOn the el directly, I get an error:
        // 'Cannot assign to read only property'
        const clone = Object.assign({}, el)
        clone.shadow$$ = el.shadow$$
        clone.$$ = el.$$
        const spy = jest.spyOn(clone,'$$')
        clone.shadow$$('#shadowfoo')
        expect(spy).toHaveBeenCalledWith(expect.any(Function))
        spy.mockClear()
    })

})
