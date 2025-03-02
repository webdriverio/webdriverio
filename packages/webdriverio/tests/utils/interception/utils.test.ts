import { it, expect, vi, describe, beforeAll } from 'vitest'
import { parseOverwrite, getPatternParam, globToURLPattern } from '../../../src/utils/interception/utils.js'

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
        expect(getPatternParam({ protocol: 'https', hostname: 'foo.com', port: '', pathname: '*' } as any, 'pathname')).toBe('\\*')
        expect(getPatternParam({ pathname: '*', hostname: '*' } as any, 'hostname')).toBe(undefined)
    })
})

describe('globToURLPattern', () => {
    interface TestCases {
        pattern: string
        matches: string[]
        nonMatches: string[]
        only?: boolean
    }

    const testCases: TestCases[] = [
        // Basic URL patterns
        {
            pattern: 'http://example.com',
            matches: ['http://example.com'],
            nonMatches: ['https://example.com', 'http://example.org']
        },

        // Complex patterns
        {
            pattern: 'http://foobar.com:1234/foo/bar.html?foo=bar',
            matches: ['http://foobar.com:1234/foo/bar.html?foo=bar'],
            nonMatches: []
        },

        // Protocol patterns
        {
            pattern: 'http*://example.com',
            matches: ['http://example.com', 'https://example.com'],
            nonMatches: ['ftp://example.com', 'ws://example.com']
        },

        // Hostname wildcards
        {
            pattern: 'https://*.example.com',
            matches: [
                'https://test.example.com',
                'https://sub.example.com',
                'https://deep.sub.example.com'
            ],
            nonMatches: [
                'https://example.com',
                'https://example.org',
                'http://sub.example.com'
            ]
        },

        // Port patterns
        {
            pattern: 'http://example.com:80*',
            matches: ['http://example.com:80', 'http://example.com:8080'],
            nonMatches: ['http://example.com', 'http://example.com:81']
        },

        // Path patterns
        {
            pattern: 'https://api.example.com/v1/**/*.json',
            matches: [
                'https://api.example.com/v1/data.json',
                'https://api.example.com/v1/users/profile.json',
                'https://api.example.com/v1/deep/nested/file.json'
            ],
            nonMatches: [
                'https://api.example.com/v2/data.json',
                'https://api.example.com/v1/data.xml',
                'http://api.example.com/v1/data.json'
            ]
        },

        // Search patterns
        {
            pattern: 'https://api.example.com/user?.json',
            matches: ['https://api.example.com/user1.json', 'https://api.example.com/userA.json'],
            nonMatches: ['https://api.example.com/user10.json', 'https://api.example.com/user.json']
        },

        // Question mark patterns
        {
            pattern: 'https://api.example.com/user?.json',
            matches: [
                'https://api.example.com/user1.json',
                'https://api.example.com/userA.json'
            ],
            nonMatches: [
                'https://api.example.com/user10.json',
                'https://api.example.com/user.json'
            ]
        },

        // Brace expansion
        {
            pattern: 'https://api.example.com/{users,posts}/{1,2,3}.json',
            matches: [
                'https://api.example.com/users/1.json',
                'https://api.example.com/users/2.json',
                'https://api.example.com/posts/3.json'
            ],
            nonMatches: [
                'https://api.example.com/comments/1.json',
                'https://api.example.com/users/4.json'
            ]
        },

        // Complex patterns
        {
            pattern: 'http*://*.example.{com,org}/v*/data/*.{json,xml}',
            matches: [
                'http://api.example.com/v1/data/users.json',
                'https://sub.example.org/v2/data/posts.xml',
                'https://test.example.com/v3/data/config.json'
            ],
            nonMatches: [
                'http://example.net/v1/data/users.json',
                'https://api.example.com/v1/other/data.json',
                'https://api.example.com/v1/data/users.yaml'
            ]
        },

        // Edge cases
        {
            pattern: '**',
            matches: [
                'http://example.com',
                'https://api.example.org/path',
            ],
            nonMatches: []
        },
        {
            pattern: 'http://{sub1,sub2}.example.com/**/*.min.{js,css}',
            matches: [
                'http://sub1.example.com/dist/app.min.js',
                'http://sub2.example.com/assets/style.min.css',
                'http://sub1.example.com/nested/deep/lib.min.js'
            ],
            nonMatches: [
                'http://sub3.example.com/dist/app.min.js',
                'http://sub1.example.com/dist/app.js',
                'https://sub1.example.com/dist/app.min.js'
            ]
        }
    ]

    testCases.forEach(({ pattern, matches, nonMatches, only }) => {
        describe(`pattern: ${pattern}`, () => {
            const test = only ? it.only : it
            let urlPattern: URLPattern

            beforeAll(() => {
                urlPattern = globToURLPattern(pattern)

                if (only) {
                    console.log('URLPattern parameters:')
                    console.log(JSON.stringify({
                        protocol: urlPattern.protocol,
                        username: urlPattern.username,
                        password: urlPattern.password,
                        hostname: urlPattern.hostname,
                        port: urlPattern.port,
                        pathname: urlPattern.pathname,
                        search: urlPattern.search,
                        hash: urlPattern.hash
                    }, null, 2))
                }
            })

            matches.forEach((url) => {
                test(`should match: ${url}`, () => {
                    expect(urlPattern.test(url)).toBe(true)
                })
            })

            nonMatches.forEach((url) => {
                test(`should not match: ${url}`, () => {
                    expect(urlPattern.test(url)).toBe(false)
                })
            })
        })
    })

    describe('error cases', () => {
        it('should not handle empty pattern', () => {
            expect(() => globToURLPattern('')).toThrow()
        })

        it('should not handle invalid URL patterns', () => {
            expect(() => globToURLPattern(':::invalid:::')).toThrow()
        })
    })
})
