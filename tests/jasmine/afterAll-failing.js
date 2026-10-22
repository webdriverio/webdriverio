describe('Failing after all hook', () => {
    it('Should pass', async () => {
        expect(true).toBe(true)
    })

    afterAll(async () => {
        throw new Error('afterAll failed')
    })
})
