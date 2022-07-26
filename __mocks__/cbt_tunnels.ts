import { vi } from 'vitest'

const cbtTunnels = {}
const start = vi.fn().mockImplementation((options, cb) => cb(null, null))
const stop = vi.fn().mockImplementation((cb) => cb(null))

cbtTunnels.start = start
cbtTunnels.stop = stop
module.exports = cbtTunnels
