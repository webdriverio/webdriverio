import { expect, describe, it, vi } from 'vitest'

import { $$ } from '../../../src/commands/element/$$.js'
import { remote } from '../../../src/index.js'

vi.mock('got')

vi.mock('../../../src/commands/element/$$', () => ({
    __esModule: true,
    default: vi.fn().mockImplementation(() => { })
}))

/**
 * Todo(Christian): make unit test work
 */
describe.skip('shadow$$', () => {
    it('should call $$ with a function selector', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const el = await browser.$('#foo')

        await el.shadow$$('#shadowfoo')
        expect($$).toHaveBeenCalledWith(expect.any(Function))
    })
})
