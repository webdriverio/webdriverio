describe('Jasmine hook failure counts', () => {
    it('passes', () => {
        expect(true).toBe(true)
    })
    it('fails', () => {
        expect(true).toBe(false)
    })
})

afterAll(() => {
    throw new Error('Jasmine root teardown failed')
})
