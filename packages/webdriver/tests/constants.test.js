import { DEFAULTS } from '../src/constants'

test('should do correct type check for "path"', () => {
    expect(() => DEFAULTS.path.type(123)).toThrow()
    expect(() => DEFAULTS.path.type('123')).toThrow()
    expect(() => DEFAULTS.path.type('/123')).not.toThrow()
})
