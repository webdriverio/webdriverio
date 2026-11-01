describe('Promise without await in the last afterEach hook', () => {
    it('Should pass', async () => {
        expect(true).toBe(true)
    })

    afterEach(() => {
        Promise.reject(new Error('late rejection'))
    })
})
