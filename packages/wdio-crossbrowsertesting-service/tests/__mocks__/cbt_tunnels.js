const cbt_tunnels = jest.genMockFromModule('cbt_tunnels')
const start = jest.fn().mockImplementation((options, cb) => cb(null, null))
const stop = jest.fn().mockImplementation((cb) => cb(null))

cbt_tunnels.start = start
cbt_tunnels.stop = stop
module.exports = cbt_tunnels;
