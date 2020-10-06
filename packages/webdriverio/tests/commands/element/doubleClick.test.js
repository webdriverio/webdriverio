import got from 'got'
import { remote } from '../../../src'

describe('doubleClick', () => {
    beforeEach(() => {
        got.mockClear()
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
        expect(got.mock.calls[2][0].pathname).toContain('/foobar-123/actions')
        expect(got.mock.calls[2][1].json.actions).toHaveLength(1)
        expect(got.mock.calls[2][1].json.actions[0].type).toBe('pointer')
        expect(got.mock.calls[2][1].json.actions[0].actions).toHaveLength(6)
        expect(got.mock.calls[2][1].json.actions[0].actions[0].type).toBe('pointerMove')
        expect(got.mock.calls[2][1].json.actions[0].actions[0].origin.elementId).toBe('some-elem-123')
        expect(got.mock.calls[2][1].json.actions[0].actions[0].origin['element-6066-11e4-a52e-4f735466cecf']).toBe('some-elem-123')
        expect(got.mock.calls[2][1].json.actions[0].actions[0].x).toBe(0)
        expect(got.mock.calls[2][1].json.actions[0].actions[0].y).toBe(0)
        expect(got.mock.calls[2][1].json.actions[0].actions[1]).toEqual({ button: 0, type: 'pointerDown' })
        expect(got.mock.calls[2][1].json.actions[0].actions[2]).toEqual({ button: 0, type: 'pointerUp' })
        expect(got.mock.calls[2][1].json.actions[0].actions[3]).toEqual({ duration: 10, type: 'pause' })
        expect(got.mock.calls[2][1].json.actions[0].actions[4]).toEqual({ button: 0, type: 'pointerDown' })
        expect(got.mock.calls[2][1].json.actions[0].actions[5]).toEqual({ button: 0, type: 'pointerUp' })
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
        expect(got.mock.calls[2][0].pathname).toContain('/foobar-123/moveto')
        expect(got.mock.calls[2][1].json).toEqual({ element: 'some-elem-123' })

        // double click
        expect(got.mock.calls[3][0].pathname).toContain('/foobar-123/doubleclick')
    })
})
