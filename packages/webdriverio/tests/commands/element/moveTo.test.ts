import path from 'node:path'
import { expect, describe, it, afterEach, vi } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('moveTo', () => {
    it('should do a moveTo without params', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#elem')
        // @ts-ignore mock feature
        vi.mocked(fetch).setMockResponse([undefined])
        await elem.moveTo()
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0]!.pathname).toContain('/foobar-123/actions')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]!.body as any).actions).toHaveLength(1)
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]!.body as any).actions[0].type).toBe('pointer')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]!.body as any).actions[0].actions).toHaveLength(1)
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]!.body as any).actions[0].actions[0])
            .toMatchSnapshot()
    })

    it('should do a moveTo with params', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#elem')
        // @ts-ignore mock feature
        vi.mocked(fetch).setMockResponse([undefined])
        await elem.moveTo({ xOffset: 5, yOffset: 10 })
        expect(JSON.parse(vi.mocked(fetch).mock.calls[3][1]!.body as any).actions[0].actions[0])
            .toMatchSnapshot()
    })

    it('should do a moveTo without params (no-w3c)', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        const elem = await browser.$('#elem')
        await elem.moveTo()
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0]!.pathname)
            .toContain('/foobar-123/moveto')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]!.body as any))
            .toEqual({ element: 'some-elem-123' })

        await elem.moveTo({ xOffset: 5, yOffset: 10 })
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[3][0]!.pathname)
            .toContain('/foobar-123/moveto')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[3][1]!.body as any))
            .toEqual({ element: 'some-elem-123', xoffset: 5, yoffset: 10 })
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})
