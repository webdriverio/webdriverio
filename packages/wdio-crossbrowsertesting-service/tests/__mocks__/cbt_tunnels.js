const start = jest.fn().mockImplementation((options, cb) => cb(null, null))
const stop = jest.fn().mockImplementation((cb) => cb(null))

exports.start = start
exports.stop = stop
