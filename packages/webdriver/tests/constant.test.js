import { Writable } from 'stream'

import { DEFAULTS } from '../src/constants'

class LogStream extends Writable {}

test('should validate logOutput param', () => {
    expect(DEFAULTS.logOutput.type('foobar')).toBe(undefined)
    expect(DEFAULTS.logOutput.type(new LogStream())).toBe(undefined)
    expect(() => DEFAULTS.logOutput.type()).toThrow(/needs to be a string/)
    expect(() => DEFAULTS.logOutput.type(true)).toThrow(/needs to be a string/)
})
