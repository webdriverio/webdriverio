describe('Promise without await in the last afterEach hook', () => {
    it('Should pass', async () => {
        expect(true).toBe(true)
    })

    // Mocha ignores a rejection while it runs: like a slow command, this one rejects after the run (in the after hook)
    afterEach(() => {
        new Promise((_, reject) => { globalThis.rejectLateCommand = reject })
    })
})
