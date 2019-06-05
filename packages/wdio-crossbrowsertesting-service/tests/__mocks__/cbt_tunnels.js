const cbtTunnels = jest.genMockFromModule('cbt_tunnels')
const start = jest.fn().mockImplementation((options, cb) => cb(null, null))
const stop = jest.fn().mockImplementation((cb) => cb(null))

cbtTunnels.start = start
cbtTunnels.stop = stop
module.exports = cbtTunnels
