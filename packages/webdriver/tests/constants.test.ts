import { test, expect } from 'vitest'
import { DEFAULTS } from '../src/constants.js'

test('should do correct type check for "path"', () => {
    // @ts-expect-error test invalid param
    expect(() => DEFAULTS.path?.validate!(123)).toThrow()
    expect(() => DEFAULTS.path?.validate!('123')).toThrow()
    expect(() => DEFAULTS.path?.validate!('/123')).not.toThrow()
})

test('should return the passed-in request options', () => {
    const requestOptions = {
        uri: { pathname: '/wd/hub/session' }
    } as any

    expect(DEFAULTS.transformRequest!.default!(requestOptions)).toBe(requestOptions)
})

test('should return the passed-in response object', () => {
    const response = {
        body: { value: { foo: 'bar' } }
    }

    expect(DEFAULTS.transformResponse!.default!(response as any, {})).toBe(response)
})
