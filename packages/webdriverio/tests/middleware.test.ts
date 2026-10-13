import { describe, it, beforeAll, afterEach, expect, vi } from 'vitest'
import path from 'node:path'
import logger from '@wdio/logger'

import { waitForExist } from '../src/commands/element/waitForExist.js'
import refetchElement from '../src/utils/refetchElement.js'
import { StrictSelectorError } from '../src/utils/strictSelectorError.js'
import { enterCommand, leaveCommand, isMarkedNotFound, markNotFound, markWaited } from '../src/utils/elementLookup.js'
import { remote } from '../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
/**
 * Delegate to the real implementation by default so the other specs keep
 * exercising the actual refetch path; individual tests can override it once.
 */
vi.mock('../src/utils/refetchElement.js', async (importOriginal) => {
    const actual = (await importOriginal()) as { default: typeof refetchElement }
    return { __esModule: true, default: vi.fn(actual.default) }
})
/**
 * the real lookup state, with spies to count the layers of an element
 */
vi.mock('../src/utils/elementLookup.js', async (importOriginal) => {
    const actual = await importOriginal<Record<string, (...args: unknown[]) => unknown>>()
    return {
        ...actual,
        enterCommand: vi.fn(actual.enterCommand),
        leaveCommand: vi.fn(actual.leaveCommand),
        markNotFound: vi.fn(actual.markNotFound)
    }
})
vi.mock('../src/commands/element/waitUntil', () => ({
    __esModule: true,
    waitUntil: vi.fn().mockImplementation(() => { return true })
}))
vi.mock('../src/commands/element/waitForDisplayed', () => ({
    __esModule: true,
    waitForDisplayed: vi.fn().mockImplementation(() => { return true })
}))
vi.mock('../src/commands/element/waitForExist', () => ({
    __esModule: true,
    waitForExist: vi.fn().mockImplementation(() => { return true })
}))
vi.mock('../src/commands/element/waitForEnabled', () => ({
    __esModule: true,
    waitForEnabled: vi.fn().mockImplementation(() => { return true })
}))

const { warn } = logger('foobar')

describe('middleware', () => {
    let browser: WebdriverIO.Browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            },
            waitforInterval: 20,
            waitforTimeout: 100
        })
    })

    afterEach(() => {
        vi.mocked(warn).mockClear()
        vi.mocked(waitForExist).mockClear()
    })

    it('should throw an error if the element is never found', async () => {
        vi.mocked(waitForExist).mockImplementationOnce(() => {
            throw new Error('Promise was rejected with the following reason')
        })

        const elem = await browser.$('#foo')
        elem.elementId = undefined as any

        await expect(elem.click())
            .rejects.toThrow('Can\'t call click on element with selector "#foo" because element wasn\'t found')
    })

    it('should successfully click on an element that falls stale after being re-found', async () => {
        const elem = await browser.$('#foo')
        const subElem = await elem.$('#subfoo')
        const subSubElem = await subElem.$('#subsubfoo')
        subSubElem.elementId = undefined as any

        //Success returns null
        expect(await subSubElem.click()).toEqual(null)
        expect(vi.mocked(warn).mock.calls).toHaveLength(1)
        expect(vi.mocked(warn).mock.calls).toEqual([['Request encountered a stale element - terminating request']])
        // @ts-ignore mock feature
        vi.mocked(fetch).retryCnt = 0
    })

    it('should refetch an element after a BiDi no such node error', async () => {
        const isAfterNavigationDisplayed = vi.fn()
            .mockRejectedValueOnce(new Error(
                'WebDriver Bidi command "script.callFunction" failed with error: no such node - The node with the reference stale-element-123 is not known'
            ))
            .mockResolvedValueOnce(false)
        browser.addCommand('isAfterNavigationDisplayed', isAfterNavigationDisplayed, { attachToElement: true })
        const elem = await browser.$('#foo')

        // @ts-expect-error undefined custom command
        await expect(elem.isAfterNavigationDisplayed()).resolves.toBe(false)
        expect(isAfterNavigationDisplayed).toHaveBeenCalledTimes(2)
    })

    it('should successfully getAttribute of an element that falls stale after being re-found in Safari', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'safari',
                // @ts-expect-error mock feature
                keepBrowserName: true
            },
            waitforInterval: 20,
            waitforTimeout: 100
        })
        const elem = await browser.$('#foo').getElement()
        elem.selector = '#nonexisting'
        // @ts-ignore mock feature
        vi.mocked(fetch).setMockResponse([{ error: 'no such element', statusCode: 404 }, undefined, undefined, 'bar'])
        expect(await elem.getAttribute('foo')).toEqual('bar')
        expect(vi.mocked(waitForExist).mock.calls).toHaveLength(1)
        vi.mocked(fetch).mockClear()
    })

    it('should successfully click on a stale element', async () => {
        const elem = await browser.$('#foo')
        const subElem = await elem.$('#subfoo')
        const subSubElem = await subElem.$('#subsubfoo')

        //Success returns null
        expect(await subSubElem.click()).toEqual(null)
        expect(vi.mocked(warn).mock.calls).toHaveLength(1)
        expect(vi.mocked(warn).mock.calls).toEqual([['Request encountered a stale element - terminating request']])
    })

    it('re-throws the original stale error when the refetch itself fails', async () => {
        // If the page navigated away, the refetch can fail with an unrelated
        // error ("Index out of bounds"). That must not mask the original stale
        // element error, which is the actionable one for the user.
        const staleError = new Error(
            'WebDriver Bidi command "script.callFunction" failed with error: no such node - The node with the reference stale-element-123 is not known'
        )
        const staleCheck = vi.fn().mockRejectedValueOnce(staleError)
        browser.addCommand('rethrowStaleCheck', staleCheck, { attachToElement: true })
        const elem = await browser.$('#foo')

        vi.mocked(refetchElement).mockRejectedValueOnce(new Error('Index out of bounds'))

        // @ts-expect-error undefined custom command
        const error = await elem.rethrowStaleCheck().then(() => null, (e: Error) => e)
        expect(vi.mocked(refetchElement)).toHaveBeenCalled()
        expect(error).toBeInstanceOf(Error)
        expect(error?.message).toContain('stale-element-123')
        expect(error?.message).not.toContain('Index out of bounds')
    })

    /**
     * A command runs other commands on its element, and each has a middleware layer. When a
     * layer waited for the element and did not find it, the element is marked while it has an
     * active layer: the other layers of the element do not look (and wait) again (#16072).
     */
    describe('a stale element that the inner command did not find again', () => {
        const staleError = () => Object.assign(new Error('stale element reference: element is not attached'), { name: 'stale element reference' })
        /**
         * the error of a lookup that waited for the element and did not find it
         */
        const notFound = (selector = '#foo', commandName = 'getText') => {
            const err = new Error(`Can't call ${commandName} on element with selector "${selector}" because element wasn't found`)
            markWaited(err)
            return err
        }
        const real = vi.mocked(refetchElement).getMockImplementation()!
        /**
         * the refetch gives the results in order, then does not find the element
         */
        const refetchGives = (...results: WebdriverIO.Element[]) => {
            vi.mocked(refetchElement).mockClear()
            vi.mocked(refetchElement).mockImplementation(async () => {
                const next = results.shift()
                if (!next) {
                    throw notFound()
                }
                return next
            })
        }

        afterEach(() => {
            vi.mocked(refetchElement).mockImplementation(real)
        })

        it('looks for a stale element once when a command and its inner command run on it', async () => {
            browser.addCommand('innerStale', vi.fn().mockImplementation(async () => { throw staleError() }), { attachToElement: true })
            browser.addCommand('outerStale', async function (this: WebdriverIO.Element) {
                // @ts-expect-error undefined custom command
                return this.innerStale()
            }, { attachToElement: true })
            const elem = await browser.$('#foo')
            refetchGives()

            // @ts-expect-error undefined custom command
            const error = await elem.outerStale().then(() => null, (e: Error) => e)
            expect(error?.name).toBe('stale element reference')
            expect(vi.mocked(refetchElement)).toHaveBeenCalledTimes(1)
        })

        it('does not look again for an element that an inner command waited for, also after the error was dropped', async () => {
            browser.addCommand('innerStaleA', vi.fn().mockImplementation(async () => { throw staleError() }), { attachToElement: true })
            browser.addCommand('innerStaleB', vi.fn().mockImplementation(async () => { throw staleError() }), { attachToElement: true })
            browser.addCommand('outerDropsError', async function (this: WebdriverIO.Element) {
                // @ts-expect-error undefined custom command
                await this.innerStaleA().catch(() => {})
                // @ts-expect-error undefined custom command
                return this.innerStaleB()
            }, { attachToElement: true })
            const elem = await browser.$('#foo')
            refetchGives()

            // @ts-expect-error undefined custom command
            const error = await elem.outerDropsError().then(() => null, (e: Error) => e)
            expect(error?.name).toBe('stale element reference')
            expect(vi.mocked(refetchElement)).toHaveBeenCalledTimes(1)
        })

        /**
         * a command of a list finds its item again in a new way, for example when the page
         * replaced the list before the click (#16072 review, finding 1)
         */
        it('looks again for the parent of an element that was not found', async () => {
            const childStale = vi.fn()
                .mockImplementationOnce(async () => { throw staleError() })
                .mockImplementation(async () => 'clicked')
            browser.addCommand('childStaleOnce', childStale, { attachToElement: true })
            browser.addCommand('parentRunsChild', async function (this: WebdriverIO.Element) {
                // @ts-expect-error undefined custom command
                return (await this.$('#subfoo')).childStaleOnce()
            }, { attachToElement: true })
            const elem = await browser.$('#foo')
            vi.mocked(refetchElement).mockClear()
            vi.mocked(refetchElement).mockImplementation(async (el) => {
                if (el.selector === '#subfoo') {
                    throw notFound('#subfoo')
                }
                return elem
            })

            // @ts-expect-error undefined custom command
            expect(await elem.parentRunsChild()).toBe('clicked')
            expect(vi.mocked(refetchElement).mock.calls.map(([el]) => el.selector)).toEqual(['#subfoo', '#foo'])
            expect(childStale).toHaveBeenCalledTimes(2)
        })

        /**
         * the element was replaced and found again, and the retry of the command fails on
         * another element that was waited for: that is the cause to show (#16072 review, finding 3)
         */
        it('throws the error of an element that was waited for when the retry fails on it', async () => {
            const spinnerGone = notFound('#spinner', 'click')
            browser.addCommand('clickSpinner', vi.fn()
                .mockRejectedValueOnce(staleError())
                .mockRejectedValueOnce(spinnerGone), { attachToElement: true })
            const elem = await browser.$('#foo')
            refetchGives(elem)

            // @ts-expect-error undefined custom command
            const error = await elem.clickSpinner().then(() => null, (e: Error) => e)
            expect(error).toBe(spinnerGone)
            expect(error?.message).toBe('Can\'t call click on element with selector "#spinner" because element wasn\'t found')
            expect(vi.mocked(refetchElement)).toHaveBeenCalledTimes(1)
        })

        it('looks again in the next command after the element was marked', async () => {
            browser.addCommand('innerStaleNext', vi.fn().mockImplementation(async () => { throw staleError() }), { attachToElement: true })
            browser.addCommand('outerStaleNext', async function (this: WebdriverIO.Element) {
                // @ts-expect-error undefined custom command
                return this.innerStaleNext()
            }, { attachToElement: true })
            const elem = await browser.$('#foo')
            refetchGives()

            // @ts-expect-error undefined custom command
            await elem.outerStaleNext().catch(() => {})
            expect(isMarkedNotFound(elem)).toBe(false)
            // @ts-expect-error undefined custom command
            const error = await elem.outerStaleNext().then(() => null, (e: Error) => e)
            expect(error?.name).toBe('stale element reference')
            expect(vi.mocked(refetchElement)).toHaveBeenCalledTimes(2)
        })

        it('forgets the element after a command that failed in implicitWait', async () => {
            vi.mocked(waitForExist).mockImplementationOnce(() => {
                throw new Error('Promise was rejected with the following reason')
            })
            const elem = await browser.$('#foo')
            elem.elementId = undefined as any
            const isExisting = vi.spyOn(elem, 'isExisting').mockResolvedValue(false)
            vi.mocked(enterCommand).mockClear()
            vi.mocked(leaveCommand).mockClear()
            vi.mocked(markNotFound).mockClear()

            await expect(elem.click())
                .rejects.toThrow('Can\'t call click on element with selector "#foo" because element wasn\'t found')
            expect(vi.mocked(markNotFound)).toHaveBeenCalledWith(elem)
            /**
             * the layers of `click` and of the `waitForExist` that it runs
             */
            const entered = vi.mocked(enterCommand).mock.calls.filter(([el]) => el === elem).length
            expect(entered).toBe(2)
            expect(vi.mocked(leaveCommand).mock.calls.filter(([el]) => el === elem)).toHaveLength(entered)
            expect(isMarkedNotFound(elem)).toBe(false)
            isExisting.mockRestore()
        })

        it('counts the parent while its list loads', async () => {
            const elem = await browser.$('#foo')
            vi.mocked(enterCommand).mockClear()
            vi.mocked(leaveCommand).mockClear()

            await elem.$$('#subfoo')
            const entered = vi.mocked(enterCommand).mock.calls.filter(([el]) => el === elem).length
            expect(entered).toBeGreaterThan(0)
            expect(vi.mocked(leaveCommand).mock.calls.filter(([el]) => el === elem)).toHaveLength(entered)
        })

        it('is handled for a stale error that is not an Error instance', async () => {
            browser.addCommand('plainStale', vi.fn().mockRejectedValueOnce({ name: 'stale element reference', message: 'stale element reference: from another realm' }), { attachToElement: true })
            const elem = await browser.$('#foo')
            refetchGives(elem)

            // @ts-expect-error undefined custom command
            await elem.plainStale()
            expect(vi.mocked(refetchElement)).toHaveBeenCalledTimes(1)
        })

        it('throws the stale error of the command when the lookup fails with a value that is not an Error', async () => {
            const original = staleError()
            browser.addCommand('staleNotError', vi.fn().mockRejectedValueOnce(original), { attachToElement: true })
            const elem = await browser.$('#foo')
            vi.mocked(refetchElement).mockClear()
            vi.mocked(refetchElement).mockImplementation(async () => {
                throw { name: 'stale element reference', message: 'stale element reference: from another realm' }
            })

            // @ts-expect-error undefined custom command
            const error = await elem.staleNotError().then(() => null, (e: Error) => e)
            expect(error).toBe(original)
        })

        /**
         * a parent replaced while the chain is found again, or a closed window: the lookup
         * did not wait for the element, an outer layer looks again
         */
        it('is looked for again when the lookup of the inner command failed without a wait', async () => {
            browser.addCommand('innerStaleNoWait', vi.fn().mockImplementation(async () => { throw staleError() }), { attachToElement: true })
            browser.addCommand('outerStaleNoWait', async function (this: WebdriverIO.Element) {
                // @ts-expect-error undefined custom command
                return this.innerStaleNoWait()
            }, { attachToElement: true })
            const elem = await browser.$('#foo')
            vi.mocked(refetchElement).mockClear()
            vi.mocked(refetchElement).mockImplementation(async () => { throw staleError() })

            // @ts-expect-error undefined custom command
            const error = await elem.outerStaleNoWait().then(() => null, (e: Error) => e)
            expect(error?.name).toBe('stale element reference')
            expect(vi.mocked(refetchElement)).toHaveBeenCalledTimes(2)
        })
    })

    it('throws a strict-mode violation from the refetch instead of the stale error', async () => {
        const staleError = new Error('stale element reference')
        staleError.name = 'stale element reference'
        const staleCheck = vi.fn().mockRejectedValueOnce(staleError)
        browser.addCommand('strictRefetchCheck', staleCheck, { attachToElement: true })
        const elem = await browser.$('#foo')

        const strictError = new StrictSelectorError('#foo', 2)
        vi.mocked(refetchElement).mockRejectedValueOnce(strictError)

        // @ts-expect-error undefined custom command
        const error = await elem.strictRefetchCheck().then(() => null, (e: Error) => e)
        expect(vi.mocked(refetchElement)).toHaveBeenCalled()
        expect(error).toBe(strictError)
    })

    it('should assign elementId and w3c identifier to element scope after re-found', async () => {
        const elem = await browser.$('#nonexisting').getElement()
        expect(elem.elementId).toEqual(undefined)
        expect(elem['element-6066-11e4-a52e-4f735466cecf']).toEqual(undefined)

        elem.selector = '#exists'
        elem.addCommand('getThis', function(this: any) { return this })
        // @ts-expect-error undefined custom command
        const elementThis = await elem.getThis()
        expect(elementThis.elementId).toEqual('some-elem-123')
        expect(elementThis['element-6066-11e4-a52e-4f735466cecf']).toEqual('some-elem-123')
    })

    it('should assign elementId and w3c identifier to element scope after a stale element was found again', async () => {
        const staleError = new Error('stale element reference')
        staleError.name = 'stale element reference'
        const staleCheck = vi.fn().mockRejectedValueOnce(staleError).mockResolvedValueOnce('done')
        browser.addCommand('staleOnceCheck', staleCheck, { attachToElement: true })
        const elem = await browser.$('#foo')

        const refetched = await browser.$('#foo')
        refetched.elementId = 'some-new-elem-456'
        vi.mocked(refetchElement).mockResolvedValueOnce(refetched)

        // @ts-expect-error undefined custom command
        expect(await elem.staleOnceCheck()).toBe('done')
        expect(elem.elementId).toBe('some-new-elem-456')
        expect(elem['element-6066-11e4-a52e-4f735466cecf']).toBe('some-new-elem-456')
    })

    describe('should NOT wait on element if', () => {
        // wdio default waitForExist command
        it('elem EXISTS and command = waitForExist', async () => {
            const elem = await browser.$('#exists')
            await elem.waitForExist()
            expect(vi.mocked(waitForExist).mock.calls).toHaveLength(1)
        })

        const commands = [
            // wdio default commands
            'waitUntil',
            'waitForDisplayed',
            'waitForEnabled',
            'isElementDisplayed',
            'isDisplayed',
            'isExisting',

            // custom commands
            'waitUntilFoo',
            'waitForFoo',
            'isExistingFoo',
            'isDisplayedFoo']

        commands.forEach(commandName => {
            it(`elem NOT_FOUND and command = ${commandName}`, async () => {
                browser.addCommand(commandName, () => {}, { attachToElement: true })
                const elem = await browser.$('#nonexisting')
                await elem[commandName]()
                expect(vi.mocked(waitForExist).mock.calls).toHaveLength(0)
            })
        })

        it('elem EXISTS and command = foo', async () => {
            browser.addCommand('foo', () => {}, { attachToElement: true })
            const elem = await browser.$('#exists')
            // @ts-expect-error undefined custom command
            await elem.foo()
            expect(vi.mocked(waitForExist).mock.calls).toHaveLength(0)
        })

        it('elem EXISTS and command = isExisting', async () => {
            const elem = await browser.$('#exists')
            await elem.isExisting()
            expect(vi.mocked(waitForExist).mock.calls).toHaveLength(0)
        })
    })

    describe('should wait on element if', () => {
        it('elem NOT_FOUND and command = foo', async () => {
            browser.addCommand('foo', () => {}, { attachToElement: true })
            const elem = await browser.$('#nonexisting')
            // @ts-expect-error undefined custom command
            await elem.foo()
            expect(vi.mocked(waitForExist).mock.calls).toHaveLength(1)
        })
    })
})
