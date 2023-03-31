import path from 'node:path'
import { expect, describe, it, beforeEach, vi } from 'vitest'

// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'

import { remote } from '../../../src/index.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('dragAndDrop', () => {
    beforeEach(() => {
        vi.mocked(got).mockClear()
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
        got.setMockResponse([{ scrollX: 0, scrollY: 20 }])
        await elem.dragAndDrop(subElem)

        // move to
        expect(got.mock.calls[3][0].pathname).toContain('/foobar-123/actions')
        expect(got.mock.calls[3][1].json.actions).toMatchSnapshot()
        expect(got.mock.calls[4][0].pathname).toContain('/foobar-123/actions')
        expect(got.mock.calls[4][1].method).toContain('DELETE')
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
        got.setMockResponse([{ scrollX: 0, scrollY: 20 }])
        await elem.dragAndDrop({ x: 123, y: 321 })

        // move to
        expect(got.mock.calls[2][0].pathname).toContain('/foobar-123/actions')
        expect(got.mock.calls[2][1].json.actions).toHaveLength(1)
        expect(got.mock.calls[2][1].json.actions).toMatchSnapshot()
        expect(got.mock.calls[3][0].pathname).toContain('/foobar-123/actions')
        expect(got.mock.calls[3][1].method).toContain('DELETE')
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
        expect(got.mock.calls[2][0].pathname).toContain('/foobar-123/actions')
        expect(got.mock.calls[2][1].json.actions).toMatchSnapshot()
    })

    it('should do a dragAndDrop (no w3c)', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        const elem = await browser.$('#foo')
        const subElem = await elem.$('#subfoo')
        await elem.dragAndDrop(subElem)

        expect(got.mock.calls[3][0].pathname).toContain('/foobar-123/moveto')
        expect(got.mock.calls[3][1].json).toEqual({ element: 'some-elem-123' })
        expect(got.mock.calls[4][0].pathname).toContain('/foobar-123/buttondown')
        expect(got.mock.calls[5][0].pathname).toContain('/foobar-123/moveto')
        expect(got.mock.calls[5][1].json).toEqual({ element: 'some-sub-elem-321' })
        expect(got.mock.calls[6][0].pathname).toContain('/foobar-123/buttonup')
    })

    it('should do a dragAndDrop with the given duration (no w3c)', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        const elem = await browser.$('#foo')
        const subElem = await elem.$('#subfoo')

        const startTime = process.hrtime()
        await elem.dragAndDrop(subElem, { duration: 100 })
        const endTime = process.hrtime(startTime)
        const totalExecutionTime = (endTime[0] * 1e9 + endTime[1]) * 1e-6

        expect(totalExecutionTime >= 100 && totalExecutionTime < 400).toBeTruthy()

    })

    it('should do a dragAndDrop with the given coordinates (no w3c)', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        const elem = await browser.$('#foo')
        await elem.dragAndDrop({ x: 123, y: 321 })

        expect(got.mock.calls[2][0].pathname).toContain('/foobar-123/moveto')
        expect(got.mock.calls[2][1].json).toEqual({ element: 'some-elem-123' })
        expect(got.mock.calls[3][0].pathname).toContain('/foobar-123/buttondown')
        expect(got.mock.calls[4][0].pathname).toContain('/foobar-123/moveto')
        expect(got.mock.calls[4][1].json).toEqual({ element: null, xoffset: 123, yoffset: 321 })
        expect(got.mock.calls[5][0].pathname).toContain('/foobar-123/buttonup')
    })

    it('should do a dragAndDrop with the given co-ordinates and duration(no w3c)', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        const elem = await browser.$('#foo')
        const startTime = process.hrtime()
        await elem.dragAndDrop({ x: 123, y: 321 }, { duration: 200 })
        const endTime = process.hrtime(startTime)
        const totalExecutionTime = (endTime[0] * 1e9 + endTime[1]) * 1e-6

        expect(totalExecutionTime >= 200 && totalExecutionTime < 500).toBeTruthy()
    })
})
