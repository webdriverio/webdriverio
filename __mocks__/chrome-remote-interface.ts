import { vi } from 'vitest'
const CDPMock = {
    port: 4321,
    host: 'foobarhost',
    on: vi.fn(),
    emit: vi.fn(),
    Network: {
        enable: vi.fn().mockImplementation((args, cb) => cb(null, args))
    },
    Console: {
        enable: vi.fn().mockImplementation((args, cb) => cb(null, args))
    },
    Page: {
        enable: vi.fn().mockImplementation((args, cb) => cb(null, args))
    }
}

export default vi.fn().mockImplementation((args, cb) => cb(CDPMock))
