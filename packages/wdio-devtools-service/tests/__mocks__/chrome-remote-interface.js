const CDPMock = {
    port: 4321,
    host: 'foobarhost',
    on: jest.fn(),
    emit: jest.fn(),
    Network: {
        enable: jest.fn().mockImplementation((args, cb) => cb(null, args))
    },
    Console: {
        enable: jest.fn().mockImplementation((args, cb) => cb(null, args))
    },
    Page: {
        enable: jest.fn().mockImplementation((args, cb) => cb(null, args))
    }
}

export default jest.fn().mockImplementation((args, cb) => cb(CDPMock))
