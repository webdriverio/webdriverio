import got from 'got'
import { remote } from '../../../src'

describe('touchAction element test', () => {
    let browser
    let elem, subElem, subSubElem

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true
            }
        })
        elem = await browser.$('#foo')
        subElem = await elem.$('#foo')
        subSubElem = await subElem.$('#foo')
    })

    describe('single touch', () => {
        it('should transform to array', async () => {
            await elem.touchAction('press')
            expect(got.mock.calls[0][0].pathname).toContain('/touch/perform')
            expect(got.mock.calls[0][1].json).toEqual({
                actions: [
                    { action: 'press', options: { element: 'some-elem-123' } }
                ]
            })
        })

        it('should transform object into array', async () => {
            await elem.touchAction({
                action: 'press',
                x: 1,
                y: 2
            })
            expect(got.mock.calls[0][0].pathname).toContain('/touch/perform')
            expect(got.mock.calls[0][1].json).toEqual({
                actions: [
                    { action: 'press', options: { x: 1, y: 2, element: 'some-elem-123' } }
                ]
            })
        })

        it('should transform object into array if no x and y options are given', async () => {
            await elem.touchAction({ action: 'press' })
            expect(got.mock.calls[0][0].pathname).toContain('/touch/perform')
            expect(got.mock.calls[0][1].json).toEqual({
                actions: [
                    { action: 'press', options: { element: 'some-elem-123' } }
                ]
            })
        })

        it('should transform array correctly', async () => {
            await elem.touchAction([{
                action: 'press',
                x: 1,
                y: 2
            }])
            expect(got.mock.calls[0][0].pathname).toContain('/touch/perform')
            expect(got.mock.calls[0][1].json).toEqual({
                actions: [
                    { action: 'press', options: { x: 1, y: 2, element: 'some-elem-123' } }
                ]
            })
        })

        it('should handle multiple actions as strings properly', async () => {
            await elem.touchAction(['wait', 'release'])
            expect(got.mock.calls[0][0].pathname).toContain('/touch/perform')
            expect(got.mock.calls[0][1].json).toEqual({
                actions: [
                    { action: 'wait' },
                    { action: 'release' }
                ]
            })
        })

        it('should transform array correctly with selector', async () => {
            await elem.touchAction([{
                action: 'press',
                x: 1,
                y: 2
            },
            'press',
            {
                action: 'press',
                x: 3,
                y: 4
            }])
            expect(got.mock.calls[0][0].pathname).toContain('/touch/perform')
            expect(got.mock.calls[0][1].json).toEqual({
                actions: [{
                    action: 'press',
                    options: {
                        element: 'some-elem-123',
                        x: 1,
                        y: 2
                    }
                }, {
                    action: 'press',
                    options: {
                        element: 'some-elem-123'
                    }
                }, {
                    action: 'press',
                    options: {
                        element: 'some-elem-123',
                        x: 3,
                        y: 4
                    }
                }]
            })
        })

        it('should not use element as first citizen if action contains element id', async () => {
            await elem.touchAction({
                action: 'press',
                element: subElem
            })
            expect(got.mock.calls[0][0].pathname).toContain('/touch/perform')
            expect(got.mock.calls[0][1].json).toEqual({
                actions: [
                    { action: 'press', options: { element: 'some-sub-elem-321' } }
                ]
            })
        })

        it('should replace multiple selector elements to web json element', async () => {
            await elem.touchAction([{
                action: 'press',
                element: subElem,
                x: 1,
                y: 2
            }, {
                action: 'moveTo',
                element: subSubElem
            }])

            expect(got.mock.calls[0][0].pathname).toContain('/touch/perform')
            expect(got.mock.calls[0][1].json).toEqual({
                actions: [
                    { action: 'press', options: { element: 'some-sub-elem-321', x: 1, y: 2 } },
                    { action: 'moveTo', options: { element: 'some-sub-sub-elem-231' } }
                ]
            })
        })

        it('should throw an error if "release" has invalid params', () => {
            expect(elem.touchAction({ action: 'release', ms: 123 }))
                .rejects.toThrow('action "release" doesn\'t accept any options ("ms" found)')
        })

        it('should throw an error if "wait" has invalid params', () => {
            expect(elem.touchAction({ action: 'wait', x: 123 }))
                .rejects.toThrow('action "wait" doesn\'t accept x or y options')
        })

        it('should throw error if other actions contains something different than x or y', () => {
            expect(elem.touchAction({ action: 'press', ms: 123 }))
                .rejects.toThrow('action "press" doesn\'t accept "ms" as option')
        })

        it('should ignore unknown options', async () => {
            await elem.touchAction({
                action: 'press',
                x: 1,
                foobar: true,
                y: 2
            })

            expect(got.mock.calls[0][0].pathname).toContain('/touch/perform')
            expect(got.mock.calls[0][1].json).toEqual({
                actions: [
                    { action: 'press', options: { x: 1, y: 2, element: 'some-elem-123' } }
                ]
            })
        })

        it('should not ignore 0 (zero) x or y options', async () => {
            await elem.touchAction({
                action: 'moveTo',
                x: 0,
                y: 0
            })

            expect(got.mock.calls[0][0].pathname).toContain('/touch/perform')
            expect(got.mock.calls[0][1].json).toEqual({
                actions: [
                    { action: 'moveTo', options: { x: 0, y: 0, element: 'some-elem-123' } }
                ]
            })
        })
    })

    describe('multi touch', () => {
        it('should transform to array using element as first citizen', async () => {
            await elem.touchAction([['press'], ['release']])
            expect(got.mock.calls[0][0].pathname).toContain('/touch/multi/perform')
            expect(got.mock.calls[0][1].json).toEqual({
                actions: [
                    [{ action: 'press', options: { element: 'some-elem-123' } }],
                    [{ action: 'release' }]
                ]
            })
        })

        it('should transform object into array', async () => {
            await elem.touchAction([[{
                action: 'press',
                x: 1,
                y: 2
            }], [{
                action: 'tap',
                x: 112,
                y: 245
            }]])
            expect(got.mock.calls[0][1].json).toEqual({
                actions: [
                    [{ action: 'press', options: { element: 'some-elem-123', x: 1, y: 2 } }],
                    [{ action: 'tap', options: { element: 'some-elem-123', x: 112, y: 245 } }]
                ]
            })
        })

        it('should transform object into array using element as first citizen', async () => {
            await elem.touchAction([
                ['press'],
                [{
                    action: 'tap',
                    x: 3,
                    y: 4
                }]
            ])
            expect(got.mock.calls[0][1].json).toEqual({
                actions: [
                    [{ action: 'press', options: { element: 'some-elem-123' } }],
                    [{ action: 'tap', options: { element: 'some-elem-123', x: 3, y: 4 } }]
                ]
            })
        })

        it('should transform array correctly', async () => {
            await elem.touchAction([
                [{
                    action: 'press',
                    x: 1,
                    y: 2
                }],
                [{
                    action: 'longPress',
                    x: 3,
                    y: 4
                }, {
                    action: 'tap',
                    x: 5,
                    y: 6
                }]
            ])
            expect(got.mock.calls[0][1].json).toEqual({
                actions: [
                    [{ action: 'press', options: { element: 'some-elem-123', x: 1, y: 2 } }],
                    [
                        { action: 'longPress', options: { element: 'some-elem-123', x: 3, y: 4 } },
                        { action: 'tap', options: { element: 'some-elem-123', x: 5, y: 6 } }
                    ]
                ]
            })
        })
    })

    beforeEach(() => {
        got.mockClear()
    })
})
