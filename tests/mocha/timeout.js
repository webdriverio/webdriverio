const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

describe('Mocha timeout', () => {
    it('times out without retries', async () => {
        await sleep(2000)
    })

    let attempt = 0
    it('times out in the 2nd attempt', async () => {
        if (++attempt === 1) {
            throw new Error('first attempt fails')
        }
        await sleep(2000)
    }, 1)
})
