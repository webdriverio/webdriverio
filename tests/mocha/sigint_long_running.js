describe('SIGINT long running spec', () => {
    it('keeps the session open until the launcher stops it', async () => {
        console.log('SIGINT_SMOKE_READY')
        await new Promise((resolve) => setTimeout(resolve, 20000))
    }, 25000)
})
