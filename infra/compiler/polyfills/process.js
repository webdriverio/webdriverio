// Minimal process polyfill for browser
export const env = {}
export const platform = 'browser'
export const version = 'v0.0.0-browser'
export const versions = { browser: '1.0.0' }
export const cwd = () => '/'
export const nextTick = (fn, ...args) => setTimeout(() => fn(...args), 0)
export const stdout = { write: () => {} }
export const stderr = { write: () => {} }
export default { env, platform, version, versions, cwd, nextTick, stdout, stderr }
