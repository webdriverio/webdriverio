import path from 'node:path'
import { expect, describe, it, beforeEach, vi } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('dragAndDrop', () => {
    beforeEach(() => {
        vi.mocked(fetch).mockClear()
    })

    it('should throw when parameter are invalid', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#foo')
        expect.assertions(3)
        try {
            // @ts-expect-error invalid param
            await elem.dragAndDrop()
        } catch (err: any) {
            expect(err.message).toContain('requires an WebdriverIO Element')
        }

        try {
            // @ts-expect-error invalid param
            await elem.dragAndDrop('#myId')
        } catch (err: any) {
            expect(err.message).toContain('requires an WebdriverIO Element')
        }

        try {
            await elem.dragAndDrop({ x: 1 })
        } catch (err: any) {
            expect(err.message).toContain('requires an WebdriverIO Element')
        }
    })

    it('should do a dragAndDrop', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#foo')
        const subElem = await elem.$('#subfoo')
        // @ts-ignore mock feature
        vi.mocked(fetch).setMockResponse([{ scrollX: 0, scrollY: 20 }])
        await elem.dragAndDrop(subElem)

        // move to
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[3][0].pathname).toContain('/foobar-123/actions')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[3][1]?.body as any).actions).toMatchSnapshot()
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[4][0].pathname).toContain('/foobar-123/actions')
        expect(vi.mocked(fetch).mock.calls[4][1]?.method).toContain('DELETE')
    })

    it('should resolve target element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = browser.$('#foo')
        const subElem = elem.$('#subfoo')
        // @ts-ignore mock feature
        vi.mocked(fetch).setMockResponse([{ scrollX: 0, scrollY: 20 }])
        await elem.dragAndDrop(subElem)

        // move to
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[7][0].pathname).toContain('/foobar-123/actions')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[3][1]?.body as any).actions).toMatchSnapshot()
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[8][0].pathname).toContain('/foobar-123/actions')
        expect(vi.mocked(fetch).mock.calls[8][1]?.method).toContain('DELETE')
    })

    it('should do a dragAndDrop for mobile', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                platformName: 'iOS'
            } as any
        })

        const elem = await browser.$('#foo')
        const subElem = await elem.$('#subfoo')
        // @ts-ignore mock feature
        vi.mocked(fetch).setMockResponse([{ scrollX: 0, scrollY: 20 }])
        await elem.dragAndDrop(subElem)

        // move to
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[3][0].pathname).toContain('/foobar-123/actions')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[3][1]?.body as any).actions).toMatchSnapshot()
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[4][0].pathname).toContain('/foobar-123/actions')
        expect(vi.mocked(fetch).mock.calls[4][1]?.method).toContain('DELETE')
    })

    it('should do a dragAndDrop with coordinates', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#foo')
        // @ts-ignore mock feature
        vi.mocked(fetch).setMockResponse([{ scrollX: 0, scrollY: 20 }])
        await elem.dragAndDrop({ x: 123, y: 321 })

        // move to
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0].pathname).toContain('/foobar-123/actions')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]?.body as any).actions).toHaveLength(1)
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]?.body as any).actions).toMatchSnapshot()
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[3][0].pathname).toContain('/foobar-123/actions')
        expect(vi.mocked(fetch).mock.calls[3][1]?.method).toContain('DELETE')
    })

    it('should allow drag and drop to 0 coordinates', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#foo')
        await elem.dragAndDrop({ x: 0, y: 0 })

        // move to
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0].pathname).toContain('/foobar-123/actions')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]?.body as any).actions).toMatchSnapshot()
    })
})
