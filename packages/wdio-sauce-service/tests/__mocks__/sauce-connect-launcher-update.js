export default jest.fn().mockImplementation((opts, cb) => {
    cb(null, {
        close: jest.fn()
    })
})
