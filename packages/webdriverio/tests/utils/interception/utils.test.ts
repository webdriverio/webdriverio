import { it, expect, vi, describe } from 'vitest'
import { continueResponse, parseOverwrite, getPatternParam } from '../../../src/utils/interception/utils.js'

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

    it('should encode a JSON body with non-Latin1 characters as UTF-8', () => {
        const json = { city: 'Zürich', greeting: '你好 🌍' }
        const result = parseOverwrite({ body: json }, {} as any)
        expect(result.body?.type).toBe('base64')
        expect(Buffer.from(result.body!.value, 'base64').toString('utf8')).toBe(JSON.stringify(json))
    })
})

describe('continueResponse', () => {
    const NO_STATUS_TEXT = 'WebDriver Bidi command "network.continueResponse" failed with error: unknown error - Invalid http status code or phrase'
    const getBrowser = () => ({
        networkContinueResponse: vi.fn().mockResolvedValue({}),
        networkProvideResponse: vi.fn().mockResolvedValue({})
    })
    const run = (browser: ReturnType<typeof getBrowser>) => continueResponse(browser as unknown as WebdriverIO.Browser, 'req-1')

    it('lets the response through without providing a new one', async () => {
        const browser = getBrowser()
        await run(browser)
        expect(browser.networkContinueResponse.mock.calls).toEqual([[{ request: 'req-1' }]])
        expect(browser.networkProvideResponse).not.toHaveBeenCalled()
    })

    it('sends a blank reason phrase when the browser rejects the empty status text of the response', async () => {
        const browser = getBrowser()
        browser.networkContinueResponse.mockRejectedValueOnce(new Error(NO_STATUS_TEXT))
        await run(browser)
        expect(browser.networkContinueResponse.mock.calls).toEqual([
            [{ request: 'req-1' }],
            [{ request: 'req-1', reasonPhrase: ' ' }]
        ])
    })

    it('throws when the browser rejects the blank reason phrase too', async () => {
        const browser = getBrowser()
        browser.networkContinueResponse.mockRejectedValue(new Error(NO_STATUS_TEXT))
        await expect(run(browser)).rejects.toThrow(NO_STATUS_TEXT)
        expect(browser.networkContinueResponse).toHaveBeenCalledTimes(2)
    })

    it('throws any other error without a second command', async () => {
        const browser = getBrowser()
        browser.networkContinueResponse.mockRejectedValue(new Error('no such request'))
        await expect(run(browser)).rejects.toThrow('no such request')
        expect(browser.networkContinueResponse).toHaveBeenCalledTimes(1)
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

    it('should omit components that use URLPattern syntax so they are matched locally', () => {
        expect(getPatternParam({ pathname: '/users/:id' } as any, 'pathname')).toBe(undefined)
        expect(getPatternParam({ pathname: '/files/(\\d+)' } as any, 'pathname')).toBe(undefined)
        expect(getPatternParam({ pathname: '/books{/:id}?' } as any, 'pathname')).toBe(undefined)
        expect(getPatternParam({ pathname: '/img/*.png' } as any, 'pathname')).toBe(undefined)
        expect(getPatternParam({ hostname: ':sub.example.com' } as any, 'hostname')).toBe(undefined)
        expect(getPatternParam({ search: 'page=:n' } as any, 'search')).toBe(undefined)
        expect(getPatternParam({ pathname: '/users/list' } as any, 'pathname')).toBe('/users/list')
    })
})
