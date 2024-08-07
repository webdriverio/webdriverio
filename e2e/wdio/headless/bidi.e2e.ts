import { browser } from '@wdio/globals'
import type { local } from 'webdriver'

describe('bidi e2e test', () => {
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

    it('can serialize function values (sync)', async function () {
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
        expect(result).toMatchInlineSnapshot()
    })

    it('can serialize function values (async)', async function () {
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
        const result = await browser.executeAsync(asyncValidator as any, ...executeArgs as any)
        expect(result).toMatchInlineSnapshot()
    })
})
