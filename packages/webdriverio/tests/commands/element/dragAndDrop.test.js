import request from 'request'
import { remote } from '../../../src'

describe('dragAndDrop', () => {
    beforeEach(() => {
        request.mockClear()
    })

    it('should throw when parameter are invalid', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#foo')

        expect.assertions(2)
        try {
            await elem.dragAndDrop()
        } catch (e) {
            expect(e.message).toContain('requires an WebdriverIO Element')
        }

        try {
            await elem.dragAndDrop('#myId')
        } catch (e) {
            expect(e.message).toContain('requires an WebdriverIO Element')
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
        await elem.dragAndDrop(subElem)

        // move to
        expect(request.mock.calls[3][0].uri.path).toContain('/element/some-elem-123/rect')
        expect(request.mock.calls[4][0].uri.path).toContain('/element/some-sub-elem-321/rect')
        expect(request.mock.calls[5][0].uri.path).toContain('/foobar-123/actions')
        expect(request.mock.calls[5][0].body.actions).toHaveLength(1)
        expect(request.mock.calls[5][0].body.actions[0].type).toBe('pointer')
        expect(request.mock.calls[5][0].body.actions[0].actions).toHaveLength(5)
        expect(request.mock.calls[5][0].body.actions[0].actions).toEqual([
            { type: 'pointerMove', duration: 0, x: 40, y: 35 },
            { type: 'pointerDown', button: 0 },
            { type: 'pause', duration: 10 },
            { type: 'pointerMove', duration: 100, origin: 'pointer', x: 135, y: 225 },
            { type: 'pointerUp', button: 0 }
        ])
        expect(request.mock.calls[6][0].uri.path).toContain('/foobar-123/actions')
        expect(request.mock.calls[6][0].method).toContain('DELETE')
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

        expect(request.mock.calls[3][0].uri.path).toContain('/foobar-123/moveto')
        expect(request.mock.calls[3][0].body).toEqual({ element: 'some-elem-123' })
        expect(request.mock.calls[4][0].uri.path).toContain('/foobar-123/buttondown')
        expect(request.mock.calls[5][0].uri.path).toContain('/foobar-123/moveto')
        expect(request.mock.calls[5][0].body).toEqual({ element: 'some-sub-elem-321' })
        expect(request.mock.calls[6][0].uri.path).toContain('/foobar-123/buttonup')
    })
})
