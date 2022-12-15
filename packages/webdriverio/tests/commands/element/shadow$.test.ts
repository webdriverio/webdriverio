import { expect, describe, it, vi } from 'vitest'
import { remote } from '../../../src/index.js'
import { $ } from '../../../src/commands/element/$.js'

vi.mock('got')

vi.mock('../../../src/commands/element/$.js', () => ({
    __esModule: true,
    $: vi.fn().mockImplementation(() => { })
}))

/**
 * Todo(Christian): make unit test work
 */
describe('shadow$', () => {
    it('should call $ with a function selector', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const el = await browser.$('#foo')

        await el.shadow$('#shadowfoo')
        expect($).toHaveBeenCalledWith(expect.any(Function))
    })
})
