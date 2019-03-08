import { remote } from '../../../src'

jest.mock('../../../src/commands/element/$$', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => { })
}))

const $$ = require('../../../src/commands/element/$$')

describe('shadow$$', () => {
    it('should call $$ with a function selector', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const el = await browser.$('#foo')

        await el.shadow$$('#shadowfoo')
        expect($$.default).toHaveBeenCalledWith(expect.any(Function))
    })
})
