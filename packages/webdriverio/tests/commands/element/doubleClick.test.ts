import path from 'node:path'
import { expect, describe, it, beforeEach, vi } from 'vitest'

// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src/index.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('doubleClick', () => {
    beforeEach(() => {
        vi.mocked(got).mockClear()
    })

    it('should do a doubleClick', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#elem')
        await elem.doubleClick()

        // double click
        expect(vi.mocked(got).mock.calls[2][0]!.pathname).toContain('/foobar-123/actions')
        expect(vi.mocked(got).mock.calls[2][1]!.json.actions).toHaveLength(1)
        expect(vi.mocked(got).mock.calls[2][1]!.json.actions[0].type).toBe('pointer')
        expect(vi.mocked(got).mock.calls[2][1]!.json.actions[0].actions).toHaveLength(6)
        expect(vi.mocked(got).mock.calls[2][1]!.json.actions[0].actions[0].type).toBe('pointerMove')
        expect(vi.mocked(got).mock.calls[2][1]!.json.actions[0].actions[0].origin['element-6066-11e4-a52e-4f735466cecf']).toBe('some-elem-123')
        expect(vi.mocked(got).mock.calls[2][1]!.json.actions[0].actions[0].x).toBe(0)
        expect(vi.mocked(got).mock.calls[2][1]!.json.actions[0].actions[0].y).toBe(0)
        expect(vi.mocked(got).mock.calls[2][1]!.json.actions[0].actions).toMatchSnapshot()
    })

    it('should do a doubleClick (no w3c)', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        const elem = await browser.$('#elem')
        await elem.doubleClick()

        // move to
        expect(vi.mocked(got).mock.calls[2][0]!.pathname).toContain('/foobar-123/moveto')
        expect(vi.mocked(got).mock.calls[2][1]!.json).toEqual({ element: 'some-elem-123' })

        // double click
        expect(vi.mocked(got).mock.calls[3][0]!.pathname).toContain('/foobar-123/doubleclick')
    })
})
