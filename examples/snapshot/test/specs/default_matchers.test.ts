import { snapshotExpect } from '@wdio/snapshot-service'

describe('Test default jest matchers', () => {
    it('should able to use default jest matchers', async () => {
        async function asyncFunction() {
            await new Promise(resolve => setTimeout(resolve, 1000))
            return { awaited: 'value' }
        }
        await snapshotExpect(asyncFunction()).toMatchSnapshot()
        await snapshotExpect({ a: 'aa' }).toMatchSnapshot()
        await snapshotExpect({ a2: 'a' }).toMatchSnapshot('snapshot a2')
        await snapshotExpect({ a2: 'a' }).toMatchInlineSnapshot(`
Object {
  "a2": "a",
}
`)
    })
})
