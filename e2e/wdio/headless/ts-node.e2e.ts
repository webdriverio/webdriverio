// eslint-disable-next-line no-undef
describe('WebdriverIO', () => {

    // eslint-disable-next-line no-undef
    it('should support source maps when running TypeScript files', async () => {
        const location = getInvocationLocation()

        expect(location).toMatch(/ts-node.e2e.ts:6:26/)
    })
})

function getInvocationLocation(): string {
    const error = new Error('example error')
    const lines = error.stack.split('\n')
    return lines[2]
}
