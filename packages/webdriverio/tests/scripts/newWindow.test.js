import newWindow from '../../src/scripts/newWindow'

describe('newWindow script', () => {
    beforeEach(() => {
        global.window = { open: jest.fn() }
    })

    it('should check if elem is active', () => {
        newWindow('foo', 'bar', 'loo')
        expect(global.window.open.mock.calls).toHaveLength(1)
        expect(global.window.open.mock.calls[0]).toEqual(['foo', 'bar', 'loo'])
    })

    afterEach(() => {
        delete global.window
    })
})
