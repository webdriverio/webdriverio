import path from 'node:path'
import { expect, describe, it, afterEach, vi } from 'vitest'

import { remote } from '../../../src/index.js'
import { bidiGetRect, isBidiCommandsEnabled } from '../../../src/utils/bidi/elementCommands.js'

vi.mock('fetch')
vi.mock('../../../src/utils/bidi/elementCommands.js', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>()
    return { ...actual, isBidiCommandsEnabled: vi.fn(() => false), bidiGetRect: vi.fn() }
})
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

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })

    describe('with BiDi commands enabled', () => {
        it('reads the rect for offsets through BiDi', async () => {
            const browser = await remote({ baseUrl: 'http://foobar.com', capabilities: { browserName: 'foobar' } })
            const elem = await browser.$('#foo')
            vi.mocked(fetch).mockClear()
            vi.mocked(isBidiCommandsEnabled).mockReturnValue(true)
            vi.mocked(bidiGetRect).mockResolvedValue({ x: 1, y: 2, width: 50, height: 30 })
            await elem.moveTo({ xOffset: 5 })
            expect(bidiGetRect).toHaveBeenCalledWith(elem)
            expect(vi.mocked(fetch).mock.calls.map(([url]) => (url as URL).pathname)).not.toContain('/session/foobar-123/element/some-elem-123/rect')
        })

        afterEach(() => {
            vi.mocked(isBidiCommandsEnabled).mockReturnValue(false)
        })
    })
})
