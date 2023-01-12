describe('Testing after all hook', () => {
    afterAll(async () => {
        console.info('afterAll')
    })

    it('Should fail', async () => {
        expect(true).toBe(false)
        console.info('it should fail')
    })
})
