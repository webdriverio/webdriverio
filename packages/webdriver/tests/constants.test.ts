import { test, expect } from 'vitest'

import '../src/browser.js'
import { DEFAULTS } from '../src/constants.js'

test('should do correct type check for "path"', () => {
    // @ts-expect-error test invalid param
    expect(() => DEFAULTS.path?.validate!(123)).toThrow()
    expect(() => DEFAULTS.path?.validate!('123')).toThrow()
    expect(() => DEFAULTS.path?.validate!('/123')).not.toThrow()
})

test('should do correct type check for "bidiResponseTimeout"', () => {
    expect(() => DEFAULTS.bidiResponseTimeout?.validate!(0)).toThrow()
    expect(() => DEFAULTS.bidiResponseTimeout?.validate!(-1)).toThrow()
    expect(() => DEFAULTS.bidiResponseTimeout?.validate!(NaN)).toThrow()
    expect(() => DEFAULTS.bidiResponseTimeout?.validate!(Infinity)).toThrow()
    expect(() => DEFAULTS.bidiResponseTimeout?.validate!(1000)).not.toThrow()
})

/**
 * `bidi/core.ts` imports this file through `bidi/utils.ts`. A default imported from
 * `bidi/core.ts` was still undefined when `DEFAULTS` was created.
 */
test('should have a default for "bidiResponseTimeout"', () => {
    expect(DEFAULTS.bidiResponseTimeout?.default).toBe(180000)
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
