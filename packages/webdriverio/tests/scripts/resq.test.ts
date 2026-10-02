/**
 * @vitest-environment jsdom
 */
import { it, expect, vi, beforeEach, describe, afterEach } from 'vitest'
import { react$, react$$, waitToLoadReact } from '../../src/scripts/resq.js'

class MockResq {
    byProps = vi.fn().mockImplementation(() => new MockResq())
    byState = vi.fn().mockImplementation(() => new MockResq())
}

const fiber = { tag: 3 }

beforeEach(() => {
    (global.window as any).wdioReactFiber = vi.fn().mockReturnValue(fiber);
    (global.window as any).resq = {
        resq$: vi.fn().mockImplementation(() => new MockResq()),
        resq$$: vi.fn().mockImplementation(() => new MockResq()),
        waitToLoadReact: vi.fn(),
    }
})

describe('resq script', () => {
    describe('react$', () => {
        it('should call the window function', () => {
            const result = react$('Test', [{ foo: 'bar' }], { test: 123 }, {} as HTMLElement)

            const { resq$ } = (global.window as any).resq
            const { byProps } = resq$.mock.results[0].value
            const { byState } = byProps.mock.results[0].value

            expect(resq$).toBeCalledTimes(1)
            expect(resq$).toBeCalledWith('Test')
            expect(byProps).toBeCalledTimes(1)
            expect(byProps).toBeCalledWith([{ foo: 'bar' }])
            expect(byState).toBeCalledTimes(1)
            expect(byState).toBeCalledWith({ test: 123 })
            expect(result).toMatchObject({ message: 'React element with selector "Test" wasn\'t found' })
        })

        it('should return node object found', () => {
            (global.window as any).resq.resq$ = vi.fn().mockImplementation(() => ([{
                node: global.document.createElement('div')
            }]))

            const result = react$('Test', [], {}, {} as HTMLElement)

            expect(result).toMatchObject(global.document.createElement('div') as any)
        })

        it('should return the first node object for fragments', () => {
            (global.window as any).resq.resq$ = vi.fn().mockImplementation(() => ([{
                node: [global.document.createElement('div'), global.document.createElement('div')],
                isFragment: true,
            }]))

            const result = react$('Test', [], {}, {} as HTMLElement)

            expect(result).toMatchObject(global.document.createElement('div') as any)
        })
    })

    describe('react$$"', () => {
        it('should call the window functiom', () => {
            const result = react$$('Test', [{ foo: 'bar' }], { test: '123' }, {} as HTMLElement)

            const { resq$$ } = (global.window as any).resq
            const { byProps } = resq$$.mock.results[0].value
            const { byState } = byProps.mock.results[0].value

            expect(resq$$).toBeCalledTimes(1)
            expect(resq$$).toBeCalledWith('Test')
            expect(byProps).toBeCalledTimes(1)
            expect(byProps).toBeCalledWith([{ foo: 'bar' }])
            expect(byState).toBeCalledTimes(1)
            expect(byState).toBeCalledWith({ test: '123' })
            expect(result).toMatchObject([])
        })

        it('should return node objects found', () => {
            (global.window as any).resq.resq$$ = vi.fn().mockImplementation(() => ([
                { node: global.document.createElement('div') }
            ]))

            const result = react$$('Test', [], {}, {} as HTMLElement)

            expect(result).toMatchObject([global.document.createElement('div')])
        })

        it('should return array node objects for fragments', () => {
            (global.window as any).resq.resq$$ = vi.fn().mockImplementation(() => ([
                {
                    node: [global.document.createElement('div'), global.document.createElement('div')],
                    isFragment: true,
                },
                {
                    node: [global.document.createElement('div'), global.document.createElement('div')],
                    isFragment: true,
                }
            ]))

            const result = react$$('Test', [], {}, {} as HTMLElement)

            expect(result).toMatchObject([
                global.document.createElement('div'),
                global.document.createElement('div'),
                global.document.createElement('div'),
                global.document.createElement('div')
            ])
        })
    })

    describe('use the fiber of the current tree', () => {
        it('should give the fiber of the scope to resq', () => {
            const scope = global.document.createElement('ul')
            react$('Test', {}, {}, scope)
            react$$('Test', {}, {}, scope)

            expect((global.window as any).wdioReactFiber).toHaveBeenNthCalledWith(1, scope)
            expect((global.window as any).wdioReactFiber).toHaveBeenNthCalledWith(2, scope)
            expect((global.window as any).rootReactElement).toBe(fiber)
            expect((global.window as any).isReactLoaded).toBe(true)
        })

        it('should fail when the page has no React root', () => {
            (global.window as any).wdioReactFiber.mockReturnValue(undefined)

            expect(() => react$('Test', {}, {})).toThrow('Could not find the root element of your application')
            expect(() => react$$('Test', {}, {})).toThrow('Could not find the root element of your application')
        })

        it('should fail when the element is not rendered by React', () => {
            (global.window as any).wdioReactFiber.mockReturnValue(undefined)
            const scope = global.document.createElement('div')

            expect(() => react$('Test', {}, {}, scope)).toThrow('Could not find instance of React in given element')
            expect(() => react$$('Test', {}, {}, scope)).toThrow('Could not find instance of React in given element')
        })
    })
})

describe('waitToLoadReact', () => {
    const HOST_ROOT = 3
    const HOST_COMPONENT = 5

    /**
     * React keeps two copies of each fiber, the current one and the one of the
     * previous render, and stores one of them on the DOM node
     */
    const createTree = () => {
        const container = global.document.createElement('div')
        const list = global.document.createElement('ul')
        container.appendChild(list)
        global.document.body.appendChild(container)

        const fiberRoot: Record<string, unknown> = { containerInfo: container }
        const current: Record<string, unknown> = { tag: HOST_ROOT, stateNode: fiberRoot }
        const previous: Record<string, unknown> = { tag: HOST_ROOT, stateNode: fiberRoot }
        fiberRoot.current = current
        const currentList = { tag: HOST_COMPONENT, stateNode: list, return: current }
        const previousList = { tag: HOST_COMPONENT, stateNode: list, return: previous }
        current.child = currentList
        previous.child = previousList
        return { container, list, fiberRoot, current, previous, currentList, previousList }
    }
    const findFiber = (scope?: HTMLElement) => (global.window as any).wdioReactFiber(scope)

    afterEach(() => {
        global.document.body.innerHTML = ''
        vi.useRealTimers()
    })

    it('should find the current tree of a createRoot app (React 18 and 19)', async () => {
        const { container, list, current, previous, currentList, previousList } = createTree()
        Object.assign(container, { __reactContainer$abc: previous })
        Object.assign(list, { __reactFiber$abc: previousList })

        await waitToLoadReact()

        expect(findFiber()).toBe(current)
        expect(findFiber(container)).toBe(current)
        expect(findFiber(list)).toBe(currentList)
    })

    it('should find the current tree of a ReactDOM.render app (React 16 and 17)', async () => {
        const { container, list, fiberRoot, current, previousList, currentList } = createTree()
        Object.assign(container, { _reactRootContainer: { _internalRoot: fiberRoot } })
        Object.assign(list, { __reactInternalInstance$abc: previousList })

        await waitToLoadReact()

        expect(findFiber()).toBe(current)
        expect(findFiber(container)).toBe(current)
        expect(findFiber(list)).toBe(currentList)
    })

    it('should find the current tree of a ReactDOM.render app (React 18)', async () => {
        const { container, list, fiberRoot, current, previousList, currentList } = createTree()
        Object.assign(container, { _reactRootContainer: fiberRoot })
        Object.assign(list, { __reactFiber$abc: previousList })

        await waitToLoadReact()

        expect(findFiber()).toBe(current)
        expect(findFiber(container)).toBe(current)
        expect(findFiber(list)).toBe(currentList)
    })

    it('should find no fiber for an element that React did not render', async () => {
        const { container, previous } = createTree()
        Object.assign(container, { __reactContainer$abc: previous })

        await waitToLoadReact()

        expect(findFiber(global.document.createElement('div'))).toBeUndefined()
    })

    it('should wait until the page has a React root', async () => {
        vi.useFakeTimers()
        const { container, current, previous } = createTree()
        let loaded = false
        const loading = waitToLoadReact().then(() => {
            loaded = true
        })

        await vi.advanceTimersByTimeAsync(400)
        expect(loaded).toBe(false)
        Object.assign(container, { __reactContainer$abc: previous })
        await vi.advanceTimersByTimeAsync(200)
        await loading

        expect(loaded).toBe(true)
        expect(findFiber()).toBe(current)
    })

    it('should stop to wait after 5 seconds when the page has no React root', async () => {
        vi.useFakeTimers()
        let loaded = false
        const loading = waitToLoadReact().then(() => {
            loaded = true
        })

        await vi.advanceTimersByTimeAsync(4800)
        expect(loaded).toBe(false)
        await vi.advanceTimersByTimeAsync(400)
        await loading

        expect(loaded).toBe(true)
        expect(findFiber()).toBeUndefined()
    })
})

afterEach(() => {
    delete (global.window as any).resq
    delete (global.window as any).wdioReactFiber
    delete (global.window as any).rootReactElement
    delete (global.window as any).isReactLoaded
})
