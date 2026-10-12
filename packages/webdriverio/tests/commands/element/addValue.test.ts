import path from 'node:path'
import { AsyncLocalStorage } from 'node:async_hooks'
import { expect, describe, it, beforeEach, afterEach, vi } from 'vitest'

import { BIDI_MASK } from 'webdriver'
import { getContextManager, getParallelContextStore, setParallelContextStore } from '../../../src/session/context.js'
import { remote, Key } from '../../../src/index.js'
import { bidiAddValue, isBidiCommandsEnabled } from '../../../src/utils/bidi/elementCommands.js'

setParallelContextStore(new AsyncLocalStorage<string>())

vi.mock('fetch')
vi.mock('../../../src/utils/bidi/elementCommands.js', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>()
    return { ...actual, isBidiCommandsEnabled: vi.fn(() => false), bidiAddValue: vi.fn() }
})
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

let browser: WebdriverIO.Browser

describe('addValue test', () => {
    afterEach(() => {
        vi.mocked(fetch).mockClear()
        vi.mocked(isBidiCommandsEnabled).mockReturnValue(false)
    })

    describe('should allow to add value to an input element', () => {
        beforeEach(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar'
                }
            })
        })

        it('add string', async () => {
            const elem = await browser.$('#foo')
            await elem.addValue('foobar')
            // @ts-expect-error mock implementation
            expect(vi.mocked(fetch).mock.calls[2][0]!.pathname)
                .toBe('/session/foobar-123/element/some-elem-123/value')
            expect(vi.mocked(fetch).mock.calls[2][1]?.body).toEqual(JSON.stringify({
                text: 'foobar',
                value: undefined
            }))
        })

        it('add number', async () => {
            const elem = await browser.$('#foo')
            await elem.addValue(42)
            // @ts-expect-error mock implementation
            expect(vi.mocked(fetch).mock.calls[2][0]!.pathname)
                .toBe('/session/foobar-123/element/some-elem-123/value')
            expect(vi.mocked(fetch).mock.calls[2][1]?.body).toEqual(JSON.stringify({
                text: '42',
                value: undefined
            }))
        })
    })

    describe('with BiDi commands enabled', () => {
        beforeEach(async () => {
            vi.mocked(bidiAddValue).mockClear()
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar'
                }
            })
            vi.mocked(isBidiCommandsEnabled).mockReturnValue(true)
        })

        it('uses bidiAddValue by default', async () => {
            const elem = await browser.$('#foo')
            await elem.addValue('foobar')
            expect(bidiAddValue).toHaveBeenCalledWith(elem, 'foobar')
        })

        it('types masked values with BiDi key actions in the current context', async () => {
            const elem = await browser.$('#foo')
            vi.mocked(fetch).mockClear()
            vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            vi.spyOn(getContextManager(browser), 'getCurrentContext').mockResolvedValue('current-ctx')
            const perform = vi.spyOn(browser, 'inputPerformActions').mockResolvedValue({})
            const release = vi.spyOn(browser, 'inputReleaseActions').mockResolvedValue({})

            await elem.addValue('s3!', { mask: true })

            expect(bidiAddValue).not.toHaveBeenCalled()
            expect(fetch).not.toHaveBeenCalled()
            const params = perform.mock.calls[0][0]
            expect(params.context).toBe('current-ctx')
            expect(params.actions).toEqual([{
                id: 'keyboard',
                type: 'key',
                actions: ['s', '3', '!'].flatMap((value) => [
                    { type: 'keyDown', value },
                    { type: 'keyUp', value }
                ])
            }])
            expect((params as unknown as Record<symbol, unknown>)[BIDI_MASK]).toBe(true)
            expect(release).toHaveBeenCalledWith({ context: 'current-ctx' })
        })

        it('types masked values in the parallel test context', async () => {
            const elem = await browser.$('#foo')
            vi.spyOn(browser, 'execute').mockResolvedValue(undefined)
            const perform = vi.spyOn(browser, 'inputPerformActions').mockResolvedValue({})
            const release = vi.spyOn(browser, 'inputReleaseActions').mockResolvedValue({})

            await getParallelContextStore().run('test-tab', () => elem.addValue('x', { mask: true }))

            expect(perform.mock.calls[0][0].context).toBe('test-tab')
            expect(release).toHaveBeenCalledWith({ context: 'test-tab' })
        })
    })

    describe('with BiDi commands disabled', () => {
        beforeEach(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar' }
            })
        })

        it('takes the classic path when mask is set', async () => {
            const elem = await browser.$('#foo')
            const perform = vi.spyOn(browser, 'inputPerformActions')
            vi.mocked(fetch).mockClear()
            await elem.addValue('secret', { mask: true })
            expect(perform).not.toHaveBeenCalled()
            // @ts-expect-error mock implementation
            expect(vi.mocked(fetch).mock.calls[0][0]!.pathname)
                .toBe('/session/foobar-123/element/some-elem-123/value')
        })
    })

    describe('translate to unicode characters', () => {
        beforeEach(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar'
                }
            })
        })

        it('should not translate to unicode', async () => {
            const elem = await browser.$('#foo')

            await elem.addValue('Delete')
            // @ts-expect-error mock implementation
            expect(vi.mocked(fetch).mock.calls[2][0]!.pathname).toBe('/session/foobar-123/element/some-elem-123/value')
            expect(vi.mocked(fetch).mock.calls[2][1]?.body).toEqual(JSON.stringify({
                text: 'Delete',
            }))
        })
        it('should translate to unicode', async () => {
            const elem = await browser.$('#foo')

            await elem.addValue(Key.Delete)
            // @ts-expect-error mock implementation
            expect(vi.mocked(fetch).mock.calls[2][0]!.pathname).toBe('/session/foobar-123/element/some-elem-123/value')
            expect(vi.mocked(fetch).mock.calls[2][1]?.body).toEqual(JSON.stringify({
                text: '\uE017',
            }))
        })
    })
})
