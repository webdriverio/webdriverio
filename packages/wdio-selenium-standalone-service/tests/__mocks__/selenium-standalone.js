export default {
    install : jest.fn((seleniumInstallArgs, cb) => {
        cb()
    }),

    start : jest.fn((seleniumArgs, cb) => {
        cb(null, {
            kill : jest.fn(),
            stdout : { pipe: jest.fn().mockReturnValue({ pipe : jest.fn() }) },
            stderr : { pipe: jest.fn().mockReturnValue({ pipe : jest.fn() }) }
        })
    })
}