import touchAction from '../../../lib/commands/touchAction.js'

let performMultiAction, performTouchAction, scope, elementCalls

describe('touchAction', () => {
    beforeEach(() => {
        performMultiAction = sinon.spy()
        performTouchAction = sinon.spy()
        elementCalls = 0

        scope = {
            performMultiAction,
            performTouchAction,
            element: (selector) => new Promise((resolve) => {
                elementCalls++
                setTimeout(() => resolve({ value: `element-${selector}`, selector: selector }), 10)
            })
        }
    })

    describe('single touch', () => {
        it('should transform to array', async () => {
            await touchAction.call(scope, '//FooBar', 'press')
            expect(performTouchAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [{ action: 'press', options: { element: 'element-//FooBar' } }]
            })
            expect(elementCalls).to.be.equal(1)
        })

        it('should transform to array using element as first citizen', async () => {
            scope.lastResult = { value: 'element-//FooBar' }
            await touchAction.call(scope, 'press')
            expect(performTouchAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [{ action: 'press', options: { element: 'element-//FooBar' } }]
            })
            expect(elementCalls).to.be.equal(0)
        })

        it('should transform object into array', async () => {
            await touchAction.call(scope, {
                action: 'press',
                x: 1,
                y: 2
            })
            expect(performTouchAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [{ action: 'press', options: { x: 1, y: 2 } }]
            })
            expect(elementCalls).to.be.equal(0)
        })

        it('should transform object into array with selector', async () => {
            await touchAction.call(scope, '//FooBar', {
                action: 'press',
                x: 1,
                y: 2
            })
            expect(performTouchAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [{ action: 'press', options: { element: 'element-//FooBar', x: 1, y: 2 } }]
            })
            expect(elementCalls).to.be.equal(1)
        })

        it('should transform object into array using element as first citizen', async () => {
            scope.lastResult = { value: 'element-//FooBar' }
            await touchAction.call(scope, {
                action: 'press',
                x: 1,
                y: 2
            })
            expect(performTouchAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [{ action: 'press', options: { element: 'element-//FooBar', x: 1, y: 2 } }]
            })
            expect(elementCalls).to.be.equal(0)
        })

        it('should transform array correctly', async () => {
            await touchAction.call(scope, [{
                action: 'press',
                x: 1,
                y: 2
            }])
            expect(performTouchAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [{ action: 'press', options: { x: 1, y: 2 } }]
            })
            expect(elementCalls).to.be.equal(0)
        })

        it('should handle multiple actions as strings properly', async () => {
            await touchAction.call(scope, ['press', 'release'])
            expect(performTouchAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [{ action: 'press' }, { action: 'release' }]
            })
            expect(elementCalls).to.be.equal(0)
        })

        it('should transform array correctly with selector', async () => {
            await touchAction.call(scope, '//FooBar', [{
                action: 'press',
                x: 1,
                y: 2
            }])
            expect(performTouchAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [{ action: 'press', options: { element: 'element-//FooBar', x: 1, y: 2 } }]
            })
            expect(elementCalls).to.be.equal(1)
        })

        it('should transform array correctly using element as first citizen', async () => {
            scope.lastResult = { value: 'element-//FooBar' }
            await touchAction.call(scope, [{
                action: 'press',
                x: 1,
                y: 2
            }])
            expect(performTouchAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [{ action: 'press', options: { element: 'element-//FooBar', x: 1, y: 2 } }]
            })
            expect(elementCalls).to.be.equal(0)
        })

        it('should replace selector elements to web json element', async () => {
            await touchAction.call(scope, {
                action: 'press',
                selector: '//UIText'
            })
            expect(performTouchAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [{ action: 'press', options: { element: 'element-//UIText' } }]
            })
            expect(elementCalls).to.be.equal(1)
        })

        it('should support selector and x y options', async () => {
            await touchAction.call(scope, {
                action: 'press',
                selector: '//UIText',
                x: 20,
                y: 30
            })
            expect(performTouchAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [{ action: 'press', options: { element: 'element-//UIText', x: 20, y: 30 } }]
            })
            expect(elementCalls).to.be.equal(1)
        })

        it('should overwrite selector if selector is given in action', async () => {
            await touchAction.call(scope, '//FooBar', {
                action: 'press',
                selector: '//UIText'
            })
            expect(performTouchAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [{ action: 'press', options: { element: 'element-//UIText' } }]
            })
            expect(elementCalls).to.be.equal(1)
        })

        it('should not query new element if selector is given but action contains element id', async () => {
            await touchAction.call(scope, '//FooBar', {
                action: 'press',
                element: 'element-//UIText'
            })
            expect(performTouchAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [{ action: 'press', options: { element: 'element-//UIText' } }]
            })
            expect(elementCalls).to.be.equal(0)
        })

        it('should not use element as first citizen if action contains element id', async () => {
            scope.lastResult = { value: 'element-//FooBar' }
            await touchAction.call(scope, {
                action: 'press',
                element: 'element-//UIText'
            })
            expect(performTouchAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [{ action: 'press', options: { element: 'element-//UIText' } }]
            })
            expect(elementCalls).to.be.equal(0)
        })

        it('should replace multiple selector elements to web json element', async () => {
            await touchAction.call(scope, [{
                action: 'press',
                selector: '//UIText'
            }, {
                action: 'longPress',
                selector: '//FooBar'
            }])
            expect(performTouchAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [{
                    action: 'press',
                    options: { element: 'element-//UIText' }
                }, {
                    action: 'longPress',
                    options: { element: 'element-//FooBar' }
                }]
            })
            expect(elementCalls).to.be.equal(2)
        })

        it('should propagate selector to all actions', async () => {
            await touchAction.call(scope, '//UIText', [{
                action: 'press'
            }, {
                action: 'release'
            }])
            expect(performTouchAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [{
                    action: 'press',
                    options: { element: 'element-//UIText' }
                }, {
                    action: 'release'
                }]
            })
            expect(elementCalls).to.be.equal(1)
        })

        it('should propagate selector but prefer selectors/elements in action', async () => {
            await touchAction.call(scope, '//UIText', [{
                action: 'press'
            }, {
                action: 'moveTo',
                selector: '//FooBar'
            }, {
                action: 'longPress',
                element: 'element-//BarFoo'
            }, {
                action: 'release'
            }])
            expect(performTouchAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [{
                    action: 'press',
                    options: { element: 'element-//UIText' }
                }, {
                    action: 'moveTo',
                    options: { element: 'element-//FooBar' }
                }, {
                    action: 'longPress',
                    options: { element: 'element-//BarFoo' }
                }, {
                    action: 'release'
                }]
            })
            expect(elementCalls).to.be.equal(2)
        })

        it('should propagate selector but prefer selectors/elements in action with element as first citizen', async () => {
            scope.lastResult = { value: 'element-//UIText' }
            await touchAction.call(scope, [{
                action: 'press'
            }, {
                action: 'moveTo',
                selector: '//FooBar'
            }, {
                action: 'longPress',
                element: 'element-//BarFoo'
            }, {
                action: 'release'
            }])
            expect(performTouchAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [{
                    action: 'press',
                    options: { element: 'element-//UIText' }
                }, {
                    action: 'moveTo',
                    options: { element: 'element-//FooBar' }
                }, {
                    action: 'longPress',
                    options: { element: 'element-//BarFoo' }
                }, {
                    action: 'release'
                }]
            })
            expect(elementCalls).to.be.equal(1)
        })

        it('should not query same selector multiple times', async () => {
            await touchAction.call(scope, [{
                action: 'press',
                selector: '//UIText'
            }, {
                action: 'longPress',
                selector: '//UIText'
            }])
            expect(performTouchAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [{
                    action: 'press',
                    options: { element: 'element-//UIText' }
                }, {
                    action: 'longPress',
                    options: { element: 'element-//UIText' }
                }]
            })
            expect(elementCalls).to.be.equal(1)
        })

        it('should throw error if release has options', async () => {
            let hasThrownAnError = false
            try {
                await touchAction.call(scope, '//FooBar', { action: 'release', ms: 123 })
            } catch (e) {
                expect(e.message).to.be.equal('action "release" doesn\'t accept any options ("ms" found)')
                hasThrownAnError = true
            }

            expect(hasThrownAnError, 'expected error wasn\'t thrown').to.be.ok
        })

        it('should throw error if wait contains x or y', async () => {
            let hasThrownAnError = false
            try {
                await touchAction.call(scope, '//FooBar', { action: 'wait', x: 123 })
            } catch (e) {
                expect(e.message).to.be.equal('action "wait" doesn\'t accept x, y options')
                hasThrownAnError = true
            }

            expect(hasThrownAnError, 'expected error wasn\'t thrown').to.be.ok
        })

        it('should throw error if other actions contains something different than x or y', async () => {
            let hasThrownAnError = false
            try {
                await touchAction.call(scope, '//FooBar', { action: 'press', ms: 123 })
            } catch (e) {
                expect(e.message).to.be.equal('action "press" doesn\'t accept "ms" as option')
                hasThrownAnError = true
            }

            expect(hasThrownAnError, 'expected error wasn\'t thrown').to.be.ok
        })

        it('should ignore unknown options', async () => {
            await touchAction.call(scope, '//FooBar', { action: 'moveTo', x: 123, foobar: 123, y: 345 })
            expect(performTouchAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [{
                    action: 'moveTo',
                    options: { x: 123, y: 345, element: 'element-//FooBar' }
                }]
            })
            expect(elementCalls).to.be.equal(1)
        })
    })

    describe('multi touch', () => {
        it('should not query multiple elements twice', async () => {
            await touchAction.call(scope, '//FooBar', [['press'], ['press']])
            expect(performMultiAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [
                    [{ action: 'press', options: { element: 'element-//FooBar' } }],
                    [{ action: 'press', options: { element: 'element-//FooBar' } }]
                ]
            })
            expect(elementCalls).to.be.equal(1)
        })

        it('should transform to array using element as first citizen', async () => {
            scope.lastResult = { value: 'element-//FooBar' }
            await touchAction.call(scope, [['press'], ['release']])
            expect(performMultiAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [
                    [{ action: 'press', options: { element: 'element-//FooBar' } }],
                    [{ action: 'release' }]
                ]
            })
            expect(elementCalls).to.be.equal(0)
        })

        it('should transform object into array', async () => {
            await touchAction.call(scope, [[{
                action: 'press',
                x: 1,
                y: 2
            }], [{
                action: 'tap',
                x: 112,
                y: 245
            }]])
            expect(performMultiAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [
                    [{ action: 'press', options: { x: 1, y: 2 } }],
                    [{ action: 'tap', options: { x: 112, y: 245 } }]
                ]
            })
            expect(elementCalls).to.be.equal(0)
        })

        it('should transform object into array with selector', async () => {
            await touchAction.call(scope, '//FooBar', [[{
                action: 'press',
                x: 1,
                y: 2
            }], [{
                action: 'tap',
                x: 3,
                y: 4
            }]])
            expect(performMultiAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [
                    [{ action: 'press', options: { element: 'element-//FooBar', x: 1, y: 2 } }],
                    [{ action: 'tap', options: { element: 'element-//FooBar', x: 3, y: 4 } }]
                ]
            })
            expect(elementCalls).to.be.equal(1)
        })

        it('should transform object into array using element as first citizen', async () => {
            scope.lastResult = { value: 'element-//FooBar' }
            await touchAction.call(scope, [[{
                action: 'press',
                x: 1,
                y: 2
            }], [{
                action: 'tap',
                x: 3,
                y: 4
            }]])
            expect(performMultiAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [
                    [{ action: 'press', options: { element: 'element-//FooBar', x: 1, y: 2 } }],
                    [{ action: 'tap', options: { element: 'element-//FooBar', x: 3, y: 4 } }]
                ]
            })
            expect(elementCalls).to.be.equal(0)
        })

        it('should transform array correctly', async () => {
            await touchAction.call(scope, [[{
                action: 'press',
                x: 1,
                y: 2
            }], [{
                action: 'longPress',
                x: 3,
                y: 4
            }, {
                action: 'tap',
                x: 5,
                y: 6
            }]])
            expect(performMultiAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [
                    [{ action: 'press', options: { x: 1, y: 2 } }],
                    [{ action: 'longPress', options: { x: 3, y: 4 } }, { action: 'tap', options: { x: 5, y: 6 } }]
                ]
            })
            expect(elementCalls).to.be.equal(0)
        })

        it('should transform array correctly with selector', async () => {
            await touchAction.call(scope, '//FooBar', [[{
                action: 'press',
                x: 1,
                y: 2
            }], [{
                action: 'longPress',
                x: 3,
                y: 4
            }, {
                action: 'tap',
                x: 5,
                y: 6
            }]])
            expect(performMultiAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [
                    [{ action: 'press', options: { element: 'element-//FooBar', x: 1, y: 2 } }],
                    [
                        { action: 'longPress', options: { element: 'element-//FooBar', x: 3, y: 4 } },
                        { action: 'tap', options: { element: 'element-//FooBar', x: 5, y: 6 } }
                    ]
                ]
            })
            expect(elementCalls).to.be.equal(1)
        })

        it('should overwrite selector/elementId if existing in action', async () => {
            await touchAction.call(scope, '//FooBar', [[{
                action: 'press',
                element: 'test123',
                x: 1,
                y: 2
            }], [{
                action: 'longPress',
                selector: '//UIText',
                x: 3,
                y: 4
            }, {
                action: 'tap',
                x: 5,
                y: 6
            }]])
            expect(performMultiAction.getCall(0).args[0]).to.be.deep.equal({
                actions: [
                    [{ action: 'press', options: { element: 'test123', x: 1, y: 2 } }],
                    [
                        { action: 'longPress', options: { element: 'element-//UIText', x: 3, y: 4 } },
                        { action: 'tap', options: { element: 'element-//FooBar', x: 5, y: 6 } }
                    ]
                ]
            })
            expect(elementCalls).to.be.equal(2)
        })
    })
})
