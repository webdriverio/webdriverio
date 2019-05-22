const Cbt = jest.genMockFromModule('cbt_tunnels')

export const mockStart = jest.fn().mockImplementation((options, cb) => cb(null, null))
export const mockStop = jest.fn().mockImplementation((cb) => cb(null))

export const mockLocal = jest.fn().mockImplementation( function () {
    this.start = mockStart
    this.stop = mockStop
})

Cbt.Local = mockLocal
module.exports = Cbt
