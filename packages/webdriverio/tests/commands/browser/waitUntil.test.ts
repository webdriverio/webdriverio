import { expect, describe, it, beforeAll, afterEach, vi } from 'vitest'
// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src/index.js'

vi.mock('got')

describe('waitUntil', () => {
    let browser: WebdriverIO.Browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('Should throw an error if an invalid condition is used', async () => {
        let error
        let val
        // @ts-ignore uses expect-webdriverio
        expect.assertions(2)
        try {
            // @ts-ignore test invalid condition parameter
            val = await browser.waitUntil('foo', {
                timeout: 500,
                timeoutMsg: 'Timed Out',
                interval: 200
            })
        } catch (err: any) {
            error = err
        } finally {
            expect(error.message).toContain('Condition is not a function')
            expect(val).toBeUndefined()
        }
    })

    it.each([false, '', 0])('Should throw an error when the waitUntil times out e.g. doesnt resolve to a truthy value: %i', async () => {
        let error
        let val
        // @ts-ignore uses expect-webdriverio
        expect.assertions(2)
        try {
            val = await browser.waitUntil(
                () => new Promise<boolean>(
                    (resolve) => setTimeout(
                        () => resolve(false),
                        200
                    )
                ), {
                    timeout: 500,
                    timeoutMsg: 'Timed Out',
                    interval: 200
                }
            )
        } catch (err: any) {
            error = err
        } finally {
            expect(error.message).toContain('Timed Out')
            expect(val).toBeUndefined()
        }
    })

    it('Should throw an error when the promise is rejected', async () => {
        let error
        let val
        // @ts-ignore uses expect-webdriverio
        expect.assertions(2)
        try {
            val = await browser.waitUntil(
                () => new Promise<boolean>(
                    (resolve, reject) => setTimeout(
                        () => reject(new Error('foobar')),
                        200
                    )
                ), {
                    timeout: 500,
                    timeoutMsg: 'Timed Out',
                    interval: 200
                }
            )
        } catch (err: any) {
            error = err
        } finally {
            expect(error.message).toContain('waitUntil condition failed with the following reason: foobar')
            expect(val).toBeUndefined()
        }
    })

    it('Should throw an error when the promise is rejected without error message', async () => {
        let val
        // @ts-ignore uses expect-webdriverio
        expect.assertions(2)
        try {
            val = await browser.waitUntil(
                () => new Promise<boolean>(
                    (resolve, reject) => setTimeout(
                        () => reject(new Error()),
                        200
                    )
                ), {
                    timeout: 500
                }
            )
        } catch (err: any) {
            expect(err.message).toContain('waitUntil condition failed with the following reason: Error')
            expect(val).toBeUndefined()
        }
    })

    it('Should use default timeout setting from config if passed in value is not a number', async () => {
        let error
        let val
        // @ts-ignore uses expect-webdriverio
        expect.assertions(2)
        try {
            // @ts-ignore test invalid timeout parameter
            val = await browser.waitUntil(
                () => new Promise<boolean>(
                    (resolve) => setTimeout(
                        () => resolve(false),
                        500
                    )
                ), {
                    // @ts-expect-error wrong parameter
                    timeout: 'blah',
                    interval: 200
                }
            )
        } catch (err: any) {
            error = err
        } finally {
            expect(error.message).toMatch(/waitUntil condition timed out after \d+ms/)
            expect(val).toBeUndefined()
        }
    })

    it('Should use default interval setting from config if passed in value is not a number', async () => {
        let error
        let val
        // @ts-ignore uses expect-webdriverio
        expect.assertions(2)
        try {
            // @ts-ignore test invalid interval parameter
            val = await browser.waitUntil(
                () => new Promise<boolean>(
                    (resolve) => setTimeout(
                        () => resolve(false),
                        500
                    )
                ), {
                    timeout: 1000,
                    timeoutMsg: 'Timed Out',
                    // @ts-expect-error wrong parameter
                    interval: 'blah'
                }
            )
        } catch (err: any) {
            error = err
        } finally {
            expect(error.message).toContain('Timed Out')
            expect(val).toBeUndefined()
        }
    })

    it.each([true, 'false', 123])('Should pass for a truthy resolved value: %i', async(n) => {
        let error
        let val
        // @ts-ignore uses expect-webdriverio
        expect.assertions(2)
        try {
            val = await browser.waitUntil(
                () => new Promise<any>(
                    (resolve) => setTimeout(
                        () => resolve(n),
                        200
                    )
                ), {
                    timeout: 500,
                    timeoutMsg: 'Timed Out',
                    interval: 200
                }
            )
        } catch (err: any) {
            error = err
        } finally {
            expect(error).toBeUndefined()
            expect(val).toBe(n)
        }
    })

    afterEach(() => {
        vi.mocked(got).mockClear()
    })
})
