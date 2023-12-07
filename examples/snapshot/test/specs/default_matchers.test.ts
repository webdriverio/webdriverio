import { expect } from '@wdio/globals'

describe('Test default jest matchers', () => {
    it('should able to use default jest matchers', async () => {
        async function asyncFunction() {
            await new Promise(resolve => setTimeout(resolve, 1000))
            return { awaited: 'value' }
        }
        await expect(asyncFunction()).toMatchSnapshot()
        await expect({ a: 'aa' }).toMatchSnapshot()
        await expect({ a2: 'a' }).toMatchSnapshot('snapshot a2')
        await expect({ a2: 'a' }).toMatchInlineSnapshot()
    })
})
