describe('Jasmine timeout test', () => {
    it('should fail due to custom timeout', () => {
        return new Promise((resolve) => setTimeout(resolve, 2000))
    }, 1000)
})
