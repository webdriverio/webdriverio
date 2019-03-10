const Browserstack = jest.genMockFromModule('browserstack-local')

export const mockIsRunning = jest.fn().mockImplementation(() => true)
export const mockStart = jest.fn().mockImplementation((options, cb) => cb(null, null))
export const mockStop = jest.fn().mockImplementation((cb) => cb(null))

export const mockLocal = jest.fn().mockImplementation( function () {
    this.isRunning = mockIsRunning
    this.start = mockStart
    this.stop = mockStop
})

Browserstack.Local = mockLocal
module.exports = Browserstack
