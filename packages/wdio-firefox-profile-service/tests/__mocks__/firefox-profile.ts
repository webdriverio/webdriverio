const FirefoxProfile = jest.fn(() => ({
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

FirefoxProfile['copy'] = jest.fn((profileDirectory, cb) => {
    cb(null, new FirefoxProfile())
})

export default FirefoxProfile
