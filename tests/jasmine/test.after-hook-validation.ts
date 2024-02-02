describe('Jasmine afterTest() hook validation', () => {
    it('should pass', () => {
        expect(true).toBe(true)
    })

    it('should failed', () => {
        expect(false).toBe(true)
    })
})