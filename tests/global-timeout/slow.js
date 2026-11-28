const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

describe('global timeout', () => {
    it('runs longer than the globalTimeout', async () => {
        await sleep(20000)
    })
})
