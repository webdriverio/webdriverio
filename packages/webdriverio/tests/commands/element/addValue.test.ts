import path from 'node:path'
import { expect, describe, it, beforeEach, afterEach, vi } from 'vitest'

// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote, Key } from '../../../src/index.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

let browser: WebdriverIO.Browser

describe('addValue test', () => {
    afterEach(() => {
        vi.mocked(got).mockClear()
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
            expect(vi.mocked(got).mock.calls[2][0]!.pathname)
                .toBe('/session/foobar-123/element/some-elem-123/value')
            expect(vi.mocked(got).mock.calls[2][1]!.json.text).toEqual('foobar')
            expect(vi.mocked(got).mock.calls[2][1]!.json.value).toEqual(undefined)
        })

        it('add number', async () => {
            const elem = await browser.$('#foo')
            await elem.addValue(42)
            expect(vi.mocked(got).mock.calls[2][0]!.pathname)
                .toBe('/session/foobar-123/element/some-elem-123/value')
            expect(vi.mocked(got).mock.calls[2][1]!.json.text).toEqual('42')
            expect(vi.mocked(got).mock.calls[2][1]!.json.value).toEqual(undefined)
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
            expect(vi.mocked(got).mock.calls[2][0]!.pathname)
                .toBe('/session/foobar-123/element/some-elem-123/value')
            expect(vi.mocked(got).mock.calls[2][1]!.json.value)
                .toEqual(['foobar'])
            expect(vi.mocked(got).mock.calls[2][1]!.json.text).toEqual(undefined)
        })

        it('add number', async () => {
            const elem = await browser.$('#foo')

            await elem.addValue(42)
            expect(vi.mocked(got).mock.calls[2][0]!.pathname)
                .toBe('/session/foobar-123/element/some-elem-123/value')
            expect(vi.mocked(got).mock.calls[2][1]!.json.value).toEqual(['42'])
            expect(vi.mocked(got).mock.calls[2][1]!.json.text).toEqual(undefined)
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
            expect(vi.mocked(got).mock.calls[2][0]!.pathname).toBe('/session/foobar-123/element/some-elem-123/value')
            expect(vi.mocked(got).mock.calls[2][1]!.json.text).toEqual('Delete')
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
            expect(vi.mocked(got).mock.calls[2][0]!.pathname).toBe('/session/foobar-123/element/some-elem-123/value')
            expect(vi.mocked(got).mock.calls[2][1]!.json.text).toEqual('Delete')
        })
        it('should translate to unicode', async () => {
            const elem = await browser.$('#foo')

            await elem.addValue(Key.Delete)
            expect(vi.mocked(got).mock.calls[2][0]!.pathname).toBe('/session/foobar-123/element/some-elem-123/value')
            expect(vi.mocked(got).mock.calls[2][1]!.json.text).toEqual('\uE017')
        })
    })
})
