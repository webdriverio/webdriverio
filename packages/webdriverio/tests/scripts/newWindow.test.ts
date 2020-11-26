import newWindow from '../../src/scripts/newWindow'

describe('newWindow script', () => {
    beforeEach(() => {
        global.window = { open: jest.fn() } as any
    })

    it('should check if elem is active', () => {
        newWindow('foo', 'bar', 'loo')
        expect((global.window.open as jest.Mock).mock.calls).toHaveLength(1)
        expect((global.window.open as jest.Mock).mock.calls[0]).toEqual(['foo', 'bar', 'loo'])
    })

    afterEach(() => {
        delete global.window
    })
})
