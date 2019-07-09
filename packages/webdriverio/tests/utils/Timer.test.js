import Timer from '../../src/utils/Timer'

describe('timer', () => {
    describe('promise', () => {
        it('should be rejected by timeout', async () => {
            let timer = new Timer(20, 30, () => Promise.resolve(false))
            await expect(timer).rejects.toMatchObject(new Error('timeout'))
        })

        it('should be fulfilled when resolved with true value', async () => {
            let timer = new Timer(20, 30, () => Promise.resolve(true))
            await expect(timer).resolves
        })

        it('should not be fulfilled when resolved with false value', async () => {
            let timer = new Timer(20, 30, () => Promise.resolve(false))
            await expect(timer).rejects.toMatchObject(new Error('timeout'))
        })

        it('should be rejected', async () => {
            let timer = new Timer(20, 30, () => Promise.reject(new Error('err')))
            await expect(timer).rejects.toMatchObject(new Error('err'))
        })

        it('should be rejected without promise', async () => {
            let timer = new Timer(20, 30, () => 0)
            await expect(timer).rejects.toMatchObject(new Error('return value was never truthy'))
        })

        it('should be fulfilled without promise', async () => {
            let timer = new Timer(20, 30, () => 'foobar')
            expect(await timer).toBe('foobar')
        })
    })

    it('should execute condition at least once', async () => {
        let wasExecuted = false
        let timer = new Timer(100, 200, () => new Promise((resolve) =>
            setTimeout(() => {
                wasExecuted = true
                resolve(true)
            }, 500)
        ))

        await expect(timer).resolves
        await expect(wasExecuted).toBeTruthy
    })

    it('should execute synchronously', async () => {
        let timer = new Timer(20, 30, () => Promise.resolve(true), () => {return true}, true)
        await expect(timer).resolves
    })
})
