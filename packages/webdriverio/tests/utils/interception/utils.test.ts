import { it, expect, vi, describe } from 'vitest'
import { parseOverwrite, getPatternParam } from '../../../src/utils/interception/utils.js'

describe('parseOverwrite', () => {
    it('should parse request overwrite', () => {
        expect(parseOverwrite({}, {} as any)).toEqual({})
        expect(parseOverwrite({
            body: 'foobar',
            headers: { foo: 'bar' },
            cookies: [{ name: 'foo', value: 'bar' }],
            method: 'GET',
            url: 'http://foobar.com',
            statusCode: 123
        }, {} as any)).toMatchInlineSnapshot(`
          {
            "body": {
              "type": "string",
              "value": "foobar",
            },
            "cookies": [
              {
                "domain": undefined,
                "expires": undefined,
                "httpOnly": undefined,
                "name": "foo",
                "path": undefined,
                "sameSite": undefined,
                "secure": undefined,
                "value": {
                  "type": "string",
                  "value": "bar",
                },
              },
            ],
            "headers": [
              {
                "name": "foo",
                "value": {
                  "type": "string",
                  "value": "bar",
                },
              },
            ],
            "method": "GET",
            "statusCode": 123,
            "url": "http://foobar.com",
          }
        `)
    })

    it('should allow to overwrite using functions', () => {
        const body = vi.fn()
        const headers = vi.fn()
        const cookies = vi.fn()
        const method = vi.fn()
        const url = vi.fn()
        const statusCode = vi.fn()
        expect(parseOverwrite({
            body,
            headers,
            cookies,
            method,
            url,
            statusCode
        }, {} as any)).toMatchInlineSnapshot(`
          {
            "body": {
              "type": "base64",
              "value": "IiI=",
            },
            "cookies": [],
            "headers": [],
            "method": undefined,
            "statusCode": undefined,
            "url": undefined,
          }
        `)
        expect(body).toBeCalledTimes(1)
        expect(headers).toBeCalledTimes(1)
        expect(cookies).toBeCalledTimes(1)
        expect(method).toBeCalledTimes(1)
        expect(url).toBeCalledTimes(1)
        expect(statusCode).toBeCalledTimes(1)
    })
})

describe('getPatternParam', () => {
    it('should get correct pattern param', () => {
        expect(getPatternParam({ protocol: 'https', hostname: 'foo.com', port: '443', pathname: '/bar' } as any, 'protocol')).toBe('https')
        expect(getPatternParam({ protocol: 'https', hostname: 'foo.com', port: '443', pathname: '/bar' } as any, 'hostname')).toBe('foo.com')
        expect(getPatternParam({ protocol: 'https', hostname: 'foo.com', port: '443', pathname: '/bar' } as any, 'port')).toBe('443')
        expect(getPatternParam({ protocol: 'https', hostname: 'foo.com', port: '443', pathname: '/bar' } as any, 'pathname')).toBe('/bar')
        expect(getPatternParam({ protocol: 'https', hostname: 'foo.com', port: '', pathname: '/bar' } as any, 'port')).toBe('443')
        expect(getPatternParam({ protocol: 'https', hostname: 'foo.com', port: '', pathname: '/bar' } as any, 'pathname')).toBe('/bar')
        expect(getPatternParam({ protocol: 'https', hostname: 'foo.com', port: '', pathname: '*' } as any, 'pathname')).toBe(undefined)
        expect(getPatternParam({ pathname: '*', hostname: '*' } as any, 'pathname')).toBe(undefined)
        expect(getPatternParam({ pathname: '*', hostname: '*' } as any, 'hostname')).toBe(undefined)
    })
})
