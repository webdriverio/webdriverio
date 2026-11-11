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

describe('getSize test', () => {
    it('should allow to get the width and height of an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        const size = await elem.getSize()
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/rect')
        expect(size.width).toBe(50)
        expect(size.height).toBe(30)
    })

    it('should allow to get the width of an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')

        const width = await elem.getSize('width')
        expect(width).toBe(50)
        const height = await elem.getSize('height')
        expect(height).toBe(30)
        // @ts-expect-error invalid param
        const invalid = await elem.getSize('foobar')
        expect(invalid).toEqual({ width: 50, height: 30 })
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })

    describe('with BiDi commands enabled', () => {
        it('reads the size through BiDi', async () => {
            const browser = await remote({ baseUrl: 'http://foobar.com', capabilities: { browserName: 'foobar' } })
            const elem = await browser.$('#foo')
            vi.mocked(fetch).mockClear()
            vi.mocked(isBidiCommandsEnabled).mockReturnValue(true)
            vi.mocked(bidiGetRect).mockResolvedValue({ x: 1, y: 2, width: 50, height: 30 })
            expect(await elem.getSize()).toEqual({ width: 50, height: 30 })
            expect(bidiGetRect).toHaveBeenCalledWith(elem)
            expect(vi.mocked(fetch).mock.calls.map(([url]) => (url as URL).pathname)).not.toContain('/session/foobar-123/element/some-elem-123/rect')
        })

        afterEach(() => {
            vi.mocked(isBidiCommandsEnabled).mockReturnValue(false)
        })
    })
})
