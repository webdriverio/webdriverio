import { describe, it, beforeAll, beforeEach, afterEach, expect, vi } from 'vitest'
import path from 'node:path'
import logger from '@wdio/logger'

import { waitForExist } from '../src/commands/element/waitForExist.js'
import refetchElement from '../src/utils/refetchElement.js'
import { StrictSelectorError } from '../src/utils/strictSelectorError.js'
import { remote } from '../src/index.js'
import { elementErrorHandler } from '../src/middlewares.js'
import { unwrapCommand, wrapCommand } from '@wdio/utils'
import { markWaited, recordNotFound } from '../src/utils/elementNotFound.js'
import { ELEMENT_NOT_FOUND_AGAIN } from '../src/utils/errorCodes.js'

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
    // an element command copied to the browser must never unwrap to the middleware, which would run twice
    it('gives an element wrapper without the mark of wrapCommand', () => {
        for (const name of ['getText', '$$']) {
            const handler = elementErrorHandler(wrapCommand)(name, () => {})
            expect(unwrapCommand(handler)).toBe(handler)
        }
    })

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

    /**
     * A command runs other commands on its element, and each has a middleware layer. When a
     * layer waited for the element and did not find it, it throws the "wasn't found" error,
     * which the outer layers do not handle: they do not look (and wait) again (#16072).
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
        /**
         * the error of a command whose lookup waited for the element and did not find it
         */
        const expectGone = (error: Error | null) => {
            expect(error?.name).toBe('Error')
            expect(error).toHaveProperty('code', ELEMENT_NOT_FOUND_AGAIN)
            expect(error?.message).toMatch(/wasn't found/)
        }
        const real = vi.mocked(refetchElement).getMockImplementation()!
        /**
         * the refetch gives the results in order, then does not find the element
         */
        const refetchGives = (...results: WebdriverIO.Element[]) => {
            vi.mocked(refetchElement).mockClear()
            vi.mocked(refetchElement).mockImplementation(async (el) => {
                const next = results.shift()
                if (!next) {
                    /**
                     * as `refetchElement`, which records the element of the chain it did not find
                     */
                    const err = notFound()
                    recordNotFound(err, el)
                    throw err
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
            expectGone(error)
            expect(vi.mocked(refetchElement)).toHaveBeenCalledTimes(1)
        })

        /**
         * a command that starts after the failed wait (here after a dropped error) looks again, as
         * on `main`; the outer command gets the "wasn't found" error of the inner command and does
         * not look again (#16072)
         */
        it('looks again in a later command after a dropped error, and not in the outer command', async () => {
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
            expectGone(error)
            expect(vi.mocked(refetchElement)).toHaveBeenCalledTimes(2)
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
            /**
             * `#spinner` was never found: it keeps its plain error
             */
            expect(error?.name).toBe('Error')
            expect(error).not.toHaveProperty('code')
            expect(error?.message).toBe('Can\'t call click on element with selector "#spinner" because element wasn\'t found')
            expect(vi.mocked(refetchElement)).toHaveBeenCalledTimes(1)
        })

        it('names the error of a stale element that was not found again, with the stale error as its cause', async () => {
            const stale = staleError()
            browser.addCommand('staleGone', vi.fn().mockRejectedValueOnce(stale), { attachToElement: true })
            const elem = await browser.$('#foo')
            refetchGives()

            // @ts-expect-error undefined custom command
            const error = await elem.staleGone().then(() => null, (e: Error) => e)
            expect(error).toHaveProperty('code', ELEMENT_NOT_FOUND_AGAIN)
            /**
             * the lookup recorded `#foo`, the element of this command: the message names the command
             */
            expect(error?.message).toBe('Can\'t call staleGone on element with selector "#foo" because element wasn\'t found')
            expect((error as Error & { cause?: unknown }).cause).toBe(stale)
        })

        it('looks again in the next command after a lookup gave up', async () => {
            browser.addCommand('innerStaleNext', vi.fn().mockImplementation(async () => { throw staleError() }), { attachToElement: true })
            browser.addCommand('outerStaleNext', async function (this: WebdriverIO.Element) {
                // @ts-expect-error undefined custom command
                return this.innerStaleNext()
            }, { attachToElement: true })
            const elem = await browser.$('#foo')
            refetchGives()

            // @ts-expect-error undefined custom command
            await elem.outerStaleNext().catch(() => {})
            // @ts-expect-error undefined custom command
            const error = await elem.outerStaleNext().then(() => null, (e: Error) => e)
            expectGone(error)
            expect(vi.mocked(refetchElement)).toHaveBeenCalledTimes(2)
        })

        /**
         * a custom check that runs a command which waits for the element: it does not look for the
         * element again (#16072)
         */
        it('does not look again in a custom check command after its inner command gave up', async () => {
            browser.addCommand('innerStaleOfCustomCheck', vi.fn().mockImplementation(async () => { throw staleError() }), { attachToElement: true })
            browser.addCommand('isMenuDisplayed', async function (this: WebdriverIO.Element) {
                // @ts-expect-error undefined custom command
                return this.innerStaleOfCustomCheck()
            }, { attachToElement: true })
            const elem = await browser.$('#foo')
            refetchGives()

            // @ts-expect-error undefined custom command
            const error = await elem.isMenuDisplayed().then(() => null, (e: Error) => e)
            expectGone(error)
            expect(vi.mocked(refetchElement)).toHaveBeenCalledTimes(1)
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
         * a lookup that failed without a wait (for example a script error while a shadow root
         * is found again) leaves the outer layers to look again, with the stale element error (#15627)
         */
        it('throws the stale error of the command when the lookup failed without a wait', async () => {
            const original = staleError()
            browser.addCommand('staleLookupError', vi.fn().mockRejectedValueOnce(original), { attachToElement: true })
            const elem = await browser.$('#foo')
            vi.mocked(refetchElement).mockClear()
            vi.mocked(refetchElement).mockImplementation(async () => {
                throw new Error('this.querySelector is not a function')
            })

            // @ts-expect-error undefined custom command
            const error = await elem.staleLookupError().then(() => null, (e: Error) => e)
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

    /**
     * a command that gets the element id as an argument runs again with the id of the element
     * that was found again, not with the stale one
     */
    describe('the retry of a command after a stale element', () => {
        const OLD_ID = 'some-elem-123'
        const NEW_ID = 'new-elem-456'
        const staleError = () => Object.assign(new Error('stale element reference: element is not attached'), { name: 'stale element reference' })
        const real = vi.mocked(refetchElement).getMockImplementation()!
        let classicBrowser: WebdriverIO.Browser

        beforeAll(async () => {
            classicBrowser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar' },
                waitforInterval: 20,
                waitforTimeout: 100
            })
        })

        beforeEach(async () => {
            const refetched = await classicBrowser.$('#foo')
            refetched.elementId = NEW_ID
            vi.mocked(refetchElement).mockClear()
            vi.mocked(refetchElement).mockResolvedValue(refetched)
            vi.mocked(fetch).customResponseFor(
                new RegExp(`/element/${OLD_ID}/property/type$`),
                { value: { error: 'stale element reference', message: 'stale element reference: element is not attached' } }
            )
            vi.mocked(fetch).customResponseFor(new RegExp(`/element/${NEW_ID}/property/type$`), { value: 'date' })
        })

        afterEach(() => {
            vi.mocked(refetchElement).mockImplementation(real)
        })

        it('sends the new element id to a protocol command', async () => {
            const elem = await classicBrowser.$('#foo')
            expect(elem.elementId).toBe(OLD_ID)

            expect(await elem.getElementProperty(elem.elementId, 'type')).toBe('date')
            expect(vi.mocked(refetchElement)).toHaveBeenCalledTimes(1)
        })

        it('looks for the element once when a command passes the element id to an inner command', async () => {
            classicBrowser.addCommand('readType', function (this: WebdriverIO.Element) {
                return this.getElementProperty(this.elementId, 'type')
            }, { attachToElement: true })
            const elem = await classicBrowser.$('#foo')

            // @ts-expect-error undefined custom command
            expect(await elem.readType()).toBe('date')
            expect(vi.mocked(refetchElement)).toHaveBeenCalledTimes(1)
        })

        it('replaces only the arguments that are the stale element id', async () => {
            const command = vi.fn().mockRejectedValueOnce(staleError()).mockResolvedValueOnce('done')
            classicBrowser.addCommand('staleWithIds', command, { attachToElement: true })
            const elem = await classicBrowser.$('#foo')

            // @ts-expect-error undefined custom command
            expect(await elem.staleWithIds(elem.elementId, 'other-elem-789', { id: OLD_ID })).toBe('done')
            expect(command.mock.calls).toEqual([
                [OLD_ID, 'other-elem-789', { id: OLD_ID }],
                [NEW_ID, 'other-elem-789', { id: OLD_ID }]
            ])
        })

        it('replaces the id of the call when an inner command found the element again before', async () => {
            const found = async (id: string) => {
                const el = await classicBrowser.$('#foo')
                el.elementId = id
                return el
            }
            vi.mocked(refetchElement).mockReset()
            vi.mocked(refetchElement)
                .mockResolvedValueOnce(await found('first-new-elem'))
                .mockResolvedValueOnce(await found(NEW_ID))
            const inner = vi.fn()
                .mockRejectedValueOnce(staleError())
                .mockRejectedValueOnce(staleError())
                .mockResolvedValueOnce('ok')
            classicBrowser.addCommand('innerStaleTwice', inner, { attachToElement: true })
            classicBrowser.addCommand('outerWithId', async function (this: WebdriverIO.Element, id: string) {
                // @ts-expect-error undefined custom command
                return [id, await this.innerStaleTwice()]
            }, { attachToElement: true })
            const elem = await classicBrowser.$('#foo')

            // @ts-expect-error undefined custom command
            expect(await elem.outerWithId(elem.elementId)).toEqual([NEW_ID, 'ok'])
        })

        it('sets the value of a date input that the page rendered again directly', async () => {
            vi.mocked(fetch).customResponseFor(/\/execute\/sync$/, { value: true })
            vi.mocked(fetch).mockClear()
            const elem = await classicBrowser.$('#foo')

            await elem.setValue('2026-10-17')
            const paths = vi.mocked(fetch).mock.calls.map(([uri]) => new URL(uri as string).pathname)
            expect(paths.filter((p) => p.endsWith('/execute/sync'))).toHaveLength(1)
            expect(paths.filter((p) => p.endsWith('/value') || p.endsWith('/clear'))).toEqual([])
        })
    })
})
