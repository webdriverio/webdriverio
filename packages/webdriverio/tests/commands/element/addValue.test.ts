import path from 'node:path'
import { expect, describe, it, beforeEach, afterEach, vi } from 'vitest'

import { remote, Key } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

let browser: WebdriverIO.Browser

describe('addValue test', () => {
    afterEach(() => {
        vi.mocked(fetch).mockClear()
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

    describe('should allow to add value to an input element using jsonwp', () => {
        beforeEach(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar-noW3C'
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
                text: undefined,
                value: ['foobar']
            }))
        })

        it('add number', async () => {
            const elem = await browser.$('#foo')

            await elem.addValue(42)
            // @ts-expect-error mock implementation
            expect(vi.mocked(fetch).mock.calls[2][0]!.pathname)
                .toBe('/session/foobar-123/element/some-elem-123/value')
            expect(vi.mocked(fetch).mock.calls[2][1]?.body).toEqual(JSON.stringify({
                value: ['42'],
                text: undefined
            }))
        })
    })

    describe('should allow to add value to an input element as workaround for /webdriverio/issues/4936', () => {
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

            await elem.addValue('Delete')
            // @ts-expect-error mock implementation
            expect(vi.mocked(fetch).mock.calls[2][0]!.pathname).toBe('/session/foobar-123/element/some-elem-123/value')
            expect(vi.mocked(fetch).mock.calls[2][1]?.body).toEqual(JSON.stringify({
                text: 'Delete',
            }))
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
