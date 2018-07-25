export default jest.fn(() => ({
    setPreference : jest.fn(),
    setProxy : jest.fn(),
    updatePreferences : jest.fn(),
    addExtensions : jest.fn((extensions, cb) => {
        cb()
    }),
    encoded : jest.fn((cb) => {
        cb(null, 'foobar')
    }),
}))
