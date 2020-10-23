import TestStats from '../../src/stats/test'

describe('TestStats', () => {
    let stat: TestStats

    beforeEach(() => {
        stat = new TestStats({
            type: 'test:start',
            title: 'should can do something',
            parent: 'My awesome feature',
            fullTitle: 'My awesome feature should can do something',
            pending: false,
            cid: '0-0',
            specs: ['/path/to/test/specs/sync.spec.js'],
            uid: 'should can do something3',
            argument: { rows: [{ location: { column: 1, line: 1 }, value: 'hallo' }] }
        })
    })

    beforeEach(() => {
        jest.resetAllMocks()
    })

    it('defines a start date', () => {
        expect(stat.type).toBe('test')
        expect(stat.start instanceof Date).toBe(true)
    })

    it('should be initialised with correct values', () => {
        stat.complete = jest.fn()

        expect(stat.type).toBe('test')
        expect(stat.cid).toBe('0-0')
        expect(stat.argument).toEqual({ rows: [{ location: { column: 1, line: 1 }, value: 'hallo' }] })
        expect(stat.uid).toBe('should can do something3')
        expect(stat.state).toBe('pending')
    })

    it('can get skipped', () => {
        stat.complete = jest.fn()
        stat.skip('for no reason')

        expect(stat.state).toBe('skipped')
        expect(stat.pendingReason).toBe('for no reason')
        expect((stat.complete as jest.Mock).mock.calls).toHaveLength(0)
    })

    it('can pass', () => {
        stat.complete = jest.fn()
        stat.pass()

        expect(stat.state).toBe('passed')
        expect((stat.complete as jest.Mock).mock.calls).toHaveLength(1)
    })

    it('can fail', () => {
        stat.complete = jest.fn()
        stat.fail([new Error('oh oh')])

        expect(stat.state).toBe('failed')
        expect(stat.errors!.length).toBe(1)
        expect(stat.errors![0].message).toBe('oh oh')

        expect(stat.error!.message).toBe('oh oh')
        expect((stat.complete as jest.Mock).mock.calls).toHaveLength(1)
    })

    it('should not throw if it fails with no errors somehow', () => {
        stat.complete = jest.fn()
        stat.fail([])

        expect(stat.errors!.length).toBe(0)
        expect(stat.state).toBe('failed')
    })

    it('should not throw if it fails with undefined errors somehow', () => {
        stat.complete = jest.fn()
        stat.fail(undefined)

        expect(stat.state).toBe('failed')
    })
})
