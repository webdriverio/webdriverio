describe('Jasmine smoke test', () => {
    it('should return sync value', () => {
        expect(browser.getTitle()).toBe('Mock Page Title')
    })
})
