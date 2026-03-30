import { browser, expect } from '@wdio/globals'
import type { local, remote } from 'webdriver'

describe('bidi e2e test', () => {
    describe('execute', () => {
        it('generates a nice stack trace', async function () {
            /**
             * bidi feature, so skip if:
             *   - browser doesn't support Bidi
             *   - browser is firefox as we see random driver exceptions
             */
            if (!browser.isBidi || browser.capabilities.browserName === 'firefox') {
                return this.skip()
            }

            const result = await browser.execute(async () => {
                const a: number = 1
                console.log('Hello Bidi')
                if (a) {
                    if (a) {
                        throw new Error('Hello Bidi')
                    }
                }
            }).catch(err => err)
            expect(result.stack).toContain('16 │ if(a){if(a){throw new Error("Hello Bidi")}}}')

            const result2 = await browser.execute(async () => {
                const a: number = 1
                console.log('Hello Bidi')
                if (a) {
                    if (a) {
                        await Promise.reject(new Error('Hello Bidi'))
                    }
                }
            }).catch(err => err)
            expect(result2.stack).toContain('27 │ if(a){if(a){await Promise.reject(new Error("Hello Bidi"))}}}')
        })
    })

    it('can send bidi commands', async function () {
        /**
         * skip in case of Safari
         */
        if (!browser.isBidi) {
            return this.skip()
        }

        const result = await browser.browsingContextGetTree({})
        const context = await browser.getWindowHandle()
        expect(result.contexts).toHaveLength(1)
        expect(result.contexts[0].context).toBe(context)
    })

    it('can listen to events', async function () {
        /**
         * skip in case of Safari
         */
        if (!browser.isBidi) {
            return this.skip()
        }

        const logEvents: local.LogEntry[] = []
        await browser.sessionSubscribe({ events: ['log.entryAdded'] })
        browser.on('log.entryAdded', (logEntry) => logEvents.push(logEntry))
        await browser.execute(() => console.log('Hello Bidi'))

        await browser.waitUntil(
            async () => logEvents.find((logEvent) => logEvent.text === 'Hello Bidi'),
            {
                timeout: 5000,
                timeoutMsg: 'Expected bidi log entry to be added'
            }
        )
    })

    const executeArgs = ['string', true, 42, -0, Infinity, -Infinity, NaN, [1, 2, 3], new Map([['foo', 'bar']]), new Set([]), /foobar/]

    /**
     * passed locally but not on CI
     */
    it.skip('can serialize function values (sync)', async function () {
        if (!browser.isBidi) {
            return this.skip()
        }

        function validator (str: string, bool: boolean, number: number, negZero: number, infin: number, negInfin: number, notANumber: number, arr: number[], map: Map<string, unknown>, set: Set<unknown>, regex: RegExp) {
            return [
                'validate string:', typeof str === 'string', '\n',
                'validate boolean', typeof bool === 'boolean', '\n',
                'validate number', typeof number === 'number', '\n',
                'valdiate negative zero', Object.is(negZero, -0), '\n',
                'validate Infinity', infin === Infinity, '\n',
                'validate negative Infinity', negInfin === -Infinity, '\n',
                'validate NaN', Number.isNaN(notANumber), '\n',
                'validate array', Array.isArray(arr), '\n',
                'validate array items', arr.every(item => typeof item === 'number'), '\n',
                'validate map', map instanceof Map, '\n',
                'validate set', set instanceof Set, '\n',
                'validate regular expression', regex instanceof RegExp, '\n'
            ]
        }
        const result = await browser.execute(validator, ...executeArgs as any)
        expect(result).toEqual([
            'validate string:',
            true,
            '\n',
            'validate boolean',
            true,
            '\n',
            'validate number',
            true,
            '\n',
            'valdiate negative zero',
            false,
            '\n',
            'validate Infinity',
            false,
            '\n',
            'validate negative Infinity',
            false,
            '\n',
            'validate NaN',
            false,
            '\n',
            'validate array',
            true,
            '\n',
            'validate array items',
            true,
            '\n',
            'validate map',
            false,
            '\n',
            'validate set',
            false,
            '\n',
            'validate regular expression',
            false,
            '\n'
        ])
    })

    /**
     * passed locally but not on CI
     */
    it.skip('can serialize function values (async)', async function () {
        if (!browser.isBidi) {
            return this.skip()
        }

        async function asyncValidator (str: string, bool: boolean, number: number, negZero: number, infin: number, negInfin: number, notANumber: number, arr: number[], map: Map<string, unknown>, set: Set<unknown>, regex: RegExp) {
            return Promise.resolve([
                'validate string:', typeof str === 'string', '\n',
                await Promise.resolve('validate boolean async'), typeof bool === 'boolean', '\n',
                'validate number', typeof number === 'number', '\n',
                'valdiate negative zero', Object.is(negZero, -0), '\n',
                'validate Infinity', infin === Infinity, '\n',
                'validate negative Infinity', negInfin === -Infinity, '\n',
                'validate NaN', Number.isNaN(notANumber), '\n',
                'validate array', Array.isArray(arr), '\n',
                'validate array items', arr.every(item => typeof item === 'number'), '\n',
                'validate map', map instanceof Map, '\n',
                'validate set', set instanceof Set, '\n',
                'validate regular expression', regex instanceof RegExp, '\n'
            ])
        }
        const result = await browser.execute(asyncValidator as any, ...executeArgs as any)
        expect(result).toEqual([
            'validate string:',
            true,
            '\n',
            'validate boolean async',
            true,
            '\n',
            'validate number',
            true,
            '\n',
            'valdiate negative zero',
            false,
            '\n',
            'validate Infinity',
            false,
            '\n',
            'validate negative Infinity',
            false,
            '\n',
            'validate NaN',
            false,
            '\n',
            'validate array',
            true,
            '\n',
            'validate array items',
            true,
            '\n',
            'validate map',
            false,
            '\n',
            'validate set',
            false,
            '\n',
            'validate regular expression',
            false,
            '\n'
        ])
    })

    it('supports execute with bidi on element scope', async () => {
        await browser.url('https://guinea-pig.webdriver.io')
        const result = await browser.$('.findme').execute(function (elem, a, b, c, d) {
            return (elem as unknown as HTMLElement).innerText.length + a + b + c + d
        }, 1, 2, 3, 4)
        expect(result).toBe(29)
    })

    describe('executeAsync', () => {
        it('allows to pass in a string', async () => {
            const script = `
                const callback = arguments[arguments.length - 1]
                Promise.resolve(...arguments)
                    .then(() => { return 2 * arguments[0] })
                    .then(callback)
            `
            const res = await browser.executeAsync(script, 2)
            expect(res).toBe(4)
        })

        it('works in browser scope', async () => {
            const result = await browser.executeAsync(function (a, b, c, d, done) {
                // browser context - you may not access client or console
                setTimeout(() => {
                    done(a + b + c + d)
                }, 3000)
            }, 1, 2, 3, 4)
            expect(result).toBe(10)
        })

        it('works on element scope', async () => {
            await browser.url('https://guinea-pig.webdriver.io')
            const result = await browser.$('.findme').executeAsync(function (elem, a, b, c, d, done) {
                // browser context - you may not access client or console
                setTimeout(() => {
                    // "Test CSS Attributes" = 19 + 1 + 2 + 3 + 4 = 29
                    done((elem as unknown as HTMLElement).innerText.length + a + b + c + d)
                }, 3000)
            }, 1, 2, 3, 4)
            expect(result).toBe(29)
        })
    })

    describe('execute', () => {
        it('allows to pass in a string', async () => {
            const script = 'return 2 * arguments[0]'
            const res = await browser.execute(script, 2)
            expect(res).toBe(4)
        })
    })

    describe('WebDriver Bidi commands', function () {

        before(async function () {
            if (!browser.isBidi) {
                // Mostly skipping safari not supporting Bidi for now!
                this.skip()
            }
        })

        describe('Storage cookies', () => {
            it('can set and get cookies with sameSite in camelCase', async () => {
                await browser.url('https://guinea-pig.webdriver.io')
                const cookieSetParam = {
                    cookie: {
                        name: 'foo10',
                        value: { type: 'string', value: 'bar' },
                        domain: 'guinea-pig.webdriver.io',
                        sameSite: 'default'
                    }
                } satisfies remote.StorageSetCookieParameters

                await browser.storageSetCookie(cookieSetParam)

                const cookiesGetParam = {
                    filter: {
                        name: 'foo10',
                    }
                } satisfies remote.StorageGetCookiesParameters
                const cookies = await browser.storageGetCookies(cookiesGetParam)

                expect(cookies.cookies.length).toBe(1)
                expect(cookies.cookies[0].name).toBe('foo10')
                expect(cookies.cookies[0].value).toEqual({ 'type': 'string', 'value': 'bar' })
                expect(cookies.cookies[0].sameSite).toBe('lax')
            })

            it('can set and get cookies with partition storageKey', async () => {

                await browser.url('https://guinea-pig.webdriver.io')
                const cookieSetParam = {
                    cookie: {
                        name: 'foo20',
                        value: { type: 'string', value: 'bar' },
                        domain: 'guinea-pig.webdriver.io',
                        sameSite: 'default',
                        secure: true // Required with partition key in Chrome???
                    },
                    partition: {
                        type: 'storageKey',
                        sourceOrigin: 'https://guinea-pig.webdriver.io',
                    },
                } satisfies remote.StorageSetCookieParameters

                await browser.storageSetCookie(cookieSetParam)

                const cookiesGetParam = {
                    filter: {
                        name: 'foo20',
                    },
                    // Note adding partition key filtering here does not allow to find back my cookie
                    // partition: {
                    //     type: 'storageKey',
                    //     sourceOrigin: 'https://guinea-pig.webdriver.io',
                    // }
                } satisfies remote.StorageGetCookiesParameters
                const cookies = await browser.storageGetCookies(cookiesGetParam)

                expect(cookies.cookies.length).toBe(1)
                expect(cookies.cookies[0].name).toBe('foo20')
                expect(cookies.cookies[0].value).toEqual({ 'type': 'string', 'value': 'bar' })
                expect(cookies.cookies[0].sameSite).toBe('lax')
            })
        })

        describe('Browser ClientWindowState', () => {

            it('can get window state', async function () {
                console.log('Getting window state')
                await browser.url('https://guinea-pig.webdriver.io')

                const windowState = await browser.browserGetClientWindows({})

                expect(windowState.clientWindows[0].state).toBeDefined()
            })

            // To enable one day once some browser support it!
            it.skip('can set window state to minimized', async function () {
                await browser.url('https://guinea-pig.webdriver.io')

                const clientWindow = await browser.getWindowHandle()

                const params: remote.BrowserSetClientWindowStateParameters = {
                    clientWindow,
                    state: 'minimized'
                }
                await browser.browserSetClientWindowState(params)

                const windowState = await browser.browserGetClientWindows({})
                expect(windowState.clientWindows[0].state).toBe('minimized')
            })

        })

        describe('Browsing Context', () => {

            it('can browsingContext.reload with ignoreCache', async function () {
                await browser.url('https://guinea-pig.webdriver.io')

                const params: remote.BrowsingContextReloadParameters = {
                    context: await browser.getWindowHandle(),
                    ignoreCache: true
                }
                const result = await browser.browsingContextReload(params)

                expect(result).toEqual({
                    navigation: expect.any(String),
                    url: 'https://guinea-pig.webdriver.io/',
                })
            })
        })

        describe('Scripts', () => {

            it('can return a ScriptEvaluateResultSuccess', async function () {
                await browser.url('https://guinea-pig.webdriver.io')
                const context = await browser.getWindowHandle()

                const params: remote.ScriptCallFunctionParameters = {
                    functionDeclaration: 'function(){ return 42 }',
                    awaitPromise: false,
                    target: {
                        context
                    }
                }
                const result = await browser.scriptCallFunction(params)

                const expectedSuccessResult: remote.ScriptEvaluateResultSuccess = {
                    realm: 'expect.any(String)',
                    type: 'success',
                    result: {
                        type: 'number',
                        value: 42
                    }
                }
                expect(result).toEqual({
                    ...expectedSuccessResult,
                    realm: expect.any(String),
                })
            })

            it('can return a ScriptEvaluateResultException', async function () {
                await browser.url('https://guinea-pig.webdriver.io')
                const context = await browser.getWindowHandle()

                const params: remote.ScriptCallFunctionParameters = {
                    functionDeclaration: 'function(){ throw new Error("Hello Bidi") }',
                    awaitPromise: false,
                    target: {
                        context
                    }
                }
                const result = await browser.scriptCallFunction(params)

                const expectedExceptionResult: remote.ScriptEvaluateResultException = {
                    'exceptionDetails': {
                        'columnNumber': 20,
                        'exception': {
                            'type': 'error'
                        },
                        'lineNumber': 6,
                        'stackTrace': {
                            'callFrames': [
                                {
                                    'columnNumber': 26,
                                    'functionName': '',
                                    'lineNumber': 6,
                                    'url': ''
                                },
                                {
                                    'columnNumber': 17,
                                    'functionName': 'callFunction',
                                    'lineNumber': 3,
                                    'url': ''
                                },
                                {
                                    'columnNumber': 13,
                                    'functionName': '',
                                    'lineNumber': 5,
                                    'url': ''
                                }
                            ]
                        },
                        'text': 'Error: Hello Bidi'
                    },
                    'realm': '-5543416938055767372.-832953021250353980',
                    'type': 'exception'
                }

                expect(result).toEqual({
                    ...expectedExceptionResult,
                    realm: expect.any(String),
                    exceptionDetails: {
                        ...expectedExceptionResult.exceptionDetails,
                    }
                })
            })
        })

        describe.only('Geolocation', () => {
            it('can set geolocation override', async function () {
                await browser.url('https://guinea-pig.webdriver.io')
                const contextId = await browser.getWindowHandle()

                const params: remote.EmulationSetGeolocationOverrideParameters = {
                    coordinates: {
                        latitude: 52.52,
                        longitude: 13.405,
                        accuracy: 1
                    },
                    // Not so optional in the end...
                    contexts: [contextId],
                }
                await browser.emulationSetGeolocationOverride(params)

                const geolocation = await browser.execute(() => {
                    return new Promise((resolve) => {
                        navigator.geolocation.getCurrentPosition((position) => {
                            resolve({
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                                accuracy: position.coords.accuracy
                            })
                        })
                    })
                })

                expect(geolocation).toEqual({
                    latitude: 52.52,
                    longitude: 13.405,
                    accuracy: 1
                })
            })
        })

    })

})
