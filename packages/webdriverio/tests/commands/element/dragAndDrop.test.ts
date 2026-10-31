import path from 'node:path'
import { ELEMENT_KEY } from 'webdriver'
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

        const actions = vi.mocked(fetch).mock.calls.find(([uri, options]) =>
            (uri as URL).pathname.endsWith('/actions') && options?.method === 'POST')
        expect(actions).toBeDefined()
        const payload = JSON.parse(actions![1]!.body as string)
        expect(payload.actions).toEqual([expect.objectContaining({
            type: 'pointer',
            actions: expect.arrayContaining([
                expect.objectContaining({ type: 'pointerMove', origin: { [ELEMENT_KEY]: 'some-elem-123' } }),
                expect.objectContaining({ type: 'pointerMove', origin: { [ELEMENT_KEY]: 'some-sub-elem-321' } })
            ])
        })])
        expect(fetch).toHaveBeenCalledWith(
            expect.objectContaining({ pathname: '/session/foobar-123/actions' }),
            expect.objectContaining({ method: 'DELETE' })
        )
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
        const origin = (elementId: string) => ({ 'element-6066-11e4-a52e-4f735466cecf': elementId })
        expect(fetch).toHaveBeenCalledWith(
            expect.objectContaining({ pathname: '/session/foobar-123/actions' }),
            expect.objectContaining({ body: JSON.stringify({ actions: [{
                id: 'pointer3',
                type: 'pointer',
                parameters: { pointerType: 'touch' },
                actions: [
                    { type: 'pointerMove', button: 0, x: 0, y: 0, duration: 0, origin: origin('some-elem-123') },
                    { type: 'pointerDown', button: 0 },
                    { type: 'pause', duration: 10 },
                    { type: 'pointerMove', button: 0, x: 0, y: 0, duration: 250, origin: origin('some-sub-elem-321') },
                    { type: 'pointerUp', button: 0 }
                ]
            }] }) })
        )
        expect(fetch).toHaveBeenCalledWith(
            expect.objectContaining({ pathname: '/session/foobar-123/actions' }),
            expect.objectContaining({ method: 'DELETE' })
        )
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
