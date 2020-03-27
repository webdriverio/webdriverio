import { DEFAULTS } from '../src/constants'

test('should do correct type check for "path"', () => {
    expect(() => DEFAULTS.path.type(123)).toThrow()
    expect(() => DEFAULTS.path.type('123')).toThrow()
    expect(() => DEFAULTS.path.type('/123')).not.toThrow()
})

test('should return the passed-in request options', () => {
    const requestOptions = {
        uri: { pathname: '/wd/hub/session' }
    }

    expect(DEFAULTS.transformRequest(requestOptions)).toBe(requestOptions)
})

test('should return the passed-in response object', () => {
    const response = {
        body: { value: { foo: 'bar' } }
    }

    expect(DEFAULTS.transformResponse(response)).toBe(response)
})
