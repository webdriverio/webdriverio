import request from 'request'
import { remote } from '../../../src'

describe('doubleClick', () => {
    beforeEach(() => {
        request.mockClear()
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
        expect(request.mock.calls[2][0].uri.path).toContain('/foobar-123/actions')
        expect(request.mock.calls[2][0].body.actions).toHaveLength(1)
        expect(request.mock.calls[2][0].body.actions[0].type).toBe('pointer')
        expect(request.mock.calls[2][0].body.actions[0].actions).toHaveLength(6)
        expect(request.mock.calls[2][0].body.actions[0].actions[0].type).toBe('pointerMove')
        expect(request.mock.calls[2][0].body.actions[0].actions[0].origin.elementId).toBe('some-elem-123')
        expect(request.mock.calls[2][0].body.actions[0].actions[0].origin['element-6066-11e4-a52e-4f735466cecf']).toBe('some-elem-123')
        expect(request.mock.calls[2][0].body.actions[0].actions[0].x).toBe(0)
        expect(request.mock.calls[2][0].body.actions[0].actions[0].y).toBe(0)
        expect(request.mock.calls[2][0].body.actions[0].actions[1]).toEqual({ button: 0, type: 'pointerDown' })
        expect(request.mock.calls[2][0].body.actions[0].actions[2]).toEqual({ button: 0, type: 'pointerUp' })
        expect(request.mock.calls[2][0].body.actions[0].actions[3]).toEqual({ duration: 10, type: 'pause' })
        expect(request.mock.calls[2][0].body.actions[0].actions[4]).toEqual({ button: 0, type: 'pointerDown' })
        expect(request.mock.calls[2][0].body.actions[0].actions[5]).toEqual({ button: 0, type: 'pointerUp' })
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
        expect(request.mock.calls[2][0].uri.path).toContain('/foobar-123/moveto')
        expect(request.mock.calls[2][0].body).toEqual({ element: 'some-elem-123' })

        // double click
        expect(request.mock.calls[3][0].uri.path).toContain('/foobar-123/doubleclick')
    })
})
