import { browser, expect } from '@wdio/globals'
import type { local } from 'webdriver'

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
        // eslint-disable-next-line wdio/no-pause
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
})
