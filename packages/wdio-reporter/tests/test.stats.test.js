import TestStats from '../src/stats/test'

describe('TestStats', () => {
    let stat

    beforeAll(() => {
        stat = new TestStats({ type: 'test:start',
            title: 'should can do something',
            parent: 'My awesome feature',
            fullTitle: 'My awesome feature should can do something',
            pending: false,
            cid: '0-0',
            specs: [ '/path/to/test/specs/sync.spec.js' ],
            uid: 'should can do something3',
            parentUid: 'My awesome feature2'
        })

        stat.complete = jest.fn()
    })

    it('should be initialised with correct values', () => {
        expect(stat.type).toBe('test')
        expect(stat.cid).toBe('0-0')
        expect(stat.uid).toBe('should can do something3')
        expect(stat.state).toBe('pending')
    })

    it('can get skipped', () => {
        stat.skip()
        expect(stat.state).toBe('skipped')
        expect(stat.complete.mock.calls).toHaveLength(0)
    })

    it('can pass', () => {
        stat.pass()
        expect(stat.state).toBe('passed')
        expect(stat.complete.mock.calls).toHaveLength(1)
        stat.complete.mockReset()
    })

    it('can fail', () => {
        stat.fail(new Error('oh oh'))
        expect(stat.state).toBe('failed')
        expect(stat.error.message).toBe('oh oh')
        expect(stat.complete.mock.calls).toHaveLength(1)
        stat.complete.mockReset()
    })
})
