import RunnableStats from '../src/stats/runnable'

describe('RunnableStats', () => {
    let stat

    beforeAll(() => {
        stat = new RunnableStats('foobar')
    })

    it('defines a start date', () => {
        expect(stat.type).toBe('foobar')
        expect(stat.start instanceof Date).toBe(true)
    })

    it('can be completed', () => {
        expect(typeof stat.duration).toBe('number')

        return new Promise((resolve, reject) => setTimeout(() => {
            stat.complete()
            const endDuration = stat.duration
            expect(typeof endDuration).toBe('number')

            return setTimeout(() => {
                if (stat.duration === endDuration) {
                    return resolve()
                }
                return reject()
            }, 10)
        }, 10))
    })
})
