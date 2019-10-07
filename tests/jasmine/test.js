describe('Jasmine smoke test', () => {
    it('should return sync value', () => {
        expect(browser.getTitle()).toBe('Mock Page Title')
    })

    let hasRun = false
    it('should retry', () => {
        if(!hasRun) {
            hasRun = true
            throw new Error('booom!')
        }
    }, 1)
})
