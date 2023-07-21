import { vi } from 'vitest'

const FirefoxProfile = vi.fn(() => ({
    setPreference : vi.fn(),
    setProxy : vi.fn(),
    updatePreferences : vi.fn(),
    addExtensions : vi.fn((extensions, cb) => {
        cb()
    }),
    encoded : vi.fn((cb) => {
        cb(null, 'foobar')
    }),
}))

// @ts-expect-error
FirefoxProfile['copy'] = vi.fn((_, cb) => {
    cb(null, new FirefoxProfile())
})

export default FirefoxProfile
