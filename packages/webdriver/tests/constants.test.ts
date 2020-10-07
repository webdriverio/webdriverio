import { DEFAULTS } from '../src/constants'

test('should do correct type check for "path"', () => {
    expect(() => DEFAULTS.path.validate!(123)).toThrow()
    expect(() => DEFAULTS.path.validate!('123')).toThrow()
    expect(() => DEFAULTS.path.validate!('/123')).not.toThrow()
})

test('should return the passed-in request options', () => {
    const requestOptions = {
        uri: { pathname: '/wd/hub/session' }
    }

    expect(DEFAULTS.transformRequest.default(requestOptions)).toBe(requestOptions)
})

test('should return the passed-in response object', () => {
    const response = {
        body: { value: { foo: 'bar' } }
    }

    expect(DEFAULTS.transformResponse.default(response)).toBe(response)
})
