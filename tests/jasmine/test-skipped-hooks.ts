describe('Jasmine smoke test to be skipped via wdio hooks', () => {
    it('should be skipped', async () => {
        expect(true).toBeFalsy()
    })
})
