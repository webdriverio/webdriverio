/**
 * @vitest-environment jsdom
 */
import { it, expect, vi, beforeEach, describe, afterEach } from 'vitest'
import { react$, react$$, waitToLoadReact } from '../../src/scripts/react.js'

const fiber = { tag: 3 }
const div = () => global.document.createElement('div')

beforeEach(() => {
    (global.window as any).__wdioReact = {
        findRoots: vi.fn().mockReturnValue([fiber]),
        findFiber: vi.fn().mockReturnValue(fiber),
        isRendered: vi.fn().mockReturnValue(false),
        query: vi.fn().mockReturnValue([])
    }
})

afterEach(() => {
    delete (global.window as any).__wdioReact
    vi.useRealTimers()
})

const api = () => (global.window as any).__wdioReact

describe('react$', () => {
    it('should query with the selector, props, state and the fiber of the scope', () => {
        const scope = div()
        const result = react$('Test', { foo: 'bar' }, { test: 123 }, scope)

        expect(api().findFiber).toBeCalledWith(scope)
        expect(api().query).toBeCalledWith('Test', { foo: 'bar' }, { test: 123 }, fiber)
        expect(result).toEqual({ message: 'React element with selector "Test" wasn\'t found' })
    })

    it('should default props and state to empty objects', () => {
        react$('Test', undefined as any, undefined as any)
        expect(api().query).toBeCalledWith('Test', {}, {}, fiber)
    })

    it('should return the node of the first component', () => {
        const first = div()
        api().query.mockReturnValue([{ node: first }, { node: div() }])
        expect(react$('Test', {}, {})).toBe(first)
    })

    it('should return the first node of a fragment', () => {
        const first = div()
        api().query.mockReturnValue([{ node: [first, div()], isFragment: true }])
        expect(react$('Test', {}, {})).toBe(first)
    })

    it('should return the first node when a component takes its nodes from a fragment', () => {
        const first = div()
        api().query.mockReturnValue([{ node: [first, div()] }])
        expect(react$('Test', {}, {})).toBe(first)
    })

    it('should return null for a component that renders nothing', () => {
        api().query.mockReturnValue([{ node: null }])
        expect(react$('Test', {}, {})).toBeNull()
    })

    it('should search each root without a scope, in order, and return the first match', () => {
        const roots = [{ tag: 3 }, { tag: 3 }]
        const found = div()
        api().findRoots.mockReturnValue(roots)
        api().query.mockImplementation((_: string, __: unknown, ___: unknown, root: unknown) => root === roots[1] ? [{ node: found }] : [])

        expect(react$('Test', {}, {})).toBe(found)
        expect(api().query.mock.calls.map((call: unknown[]) => call[3])).toEqual(roots)
        expect(api().findFiber).not.toBeCalled()
    })

    it('should stop at the first root that has a match', () => {
        const roots = [{ tag: 3 }, { tag: 3 }]
        const found = div()
        api().findRoots.mockReturnValue(roots)
        api().query.mockReturnValue([{ node: found }])

        expect(react$('Test', {}, {})).toBe(found)
        expect(api().query).toHaveBeenCalledTimes(1)
        expect(api().query).toBeCalledWith('Test', {}, {}, roots[0])
    })
})

describe('react$$', () => {
    it('should query with the selector, props, state and the fiber of the scope', () => {
        const scope = div()
        expect(react$$('Test', { foo: 'bar' }, { test: '123' }, scope)).toEqual([])

        expect(api().findFiber).toBeCalledWith(scope)
        expect(api().query).toBeCalledWith('Test', { foo: 'bar' }, { test: '123' }, fiber)
    })

    it('should return the node of each component and skip components without a node', () => {
        const nodes = [div(), div()]
        api().query.mockReturnValue([{ node: nodes[0] }, { node: null }, { node: nodes[1] }])
        expect(react$$('Test', {}, {})).toEqual(nodes)
    })

    it('should give each node once', () => {
        const nodes = [div(), div()]
        api().query.mockReturnValue([{ node: nodes[0] }, { node: nodes[0] }, { node: [nodes[1], nodes[0]], isFragment: true }])
        expect(react$$('Test', {}, {})).toEqual(nodes)
    })

    it('should give the nodes of each root without a scope, root after root', () => {
        const roots = [{ tag: 3 }, { tag: 3 }]
        const nodes = [div(), div(), div()]
        api().findRoots.mockReturnValue(roots)
        api().query.mockImplementation((_: string, __: unknown, ___: unknown, root: unknown) => (
            root === roots[0] ? [{ node: nodes[0] }, { node: nodes[1] }] : [{ node: nodes[2] }]
        ))

        expect(react$$('Test', {}, {})).toEqual(nodes)
    })

    it('should flatten the nodes of fragments', () => {
        const nodes = [div(), div(), div(), div()]
        api().query.mockReturnValue([
            { node: [nodes[0], nodes[1]], isFragment: true },
            { node: [nodes[2], nodes[3]], isFragment: true }
        ])
        expect(react$$('Test', {}, {})).toEqual(nodes)
    })
})

describe('missing React', () => {
    it('should fail when the page has no React root', () => {
        api().findRoots.mockReturnValue([])

        expect(() => react$('Test', {}, {})).toThrow('Could not find the root element of your application')
        expect(() => react$$('Test', {}, {})).toThrow('Could not find the root element of your application')
    })

    it('should fail when the element is not rendered by React', () => {
        api().findFiber.mockReturnValue(undefined)

        expect(() => react$('Test', {}, {}, div())).toThrow('Could not find instance of React in given element')
        expect(() => react$$('Test', {}, {}, div())).toThrow('Could not find instance of React in given element')
    })

    it('should fail when the query script is not on the page', () => {
        delete (global.window as any).__wdioReact

        expect(() => react$('Test', {}, {})).toThrow('Could not find the root element of your application')
    })
})

describe('waitToLoadReact', () => {
    it('should be an async function, so that execute waits for it on Classic sessions', () => {
        expect(waitToLoadReact.constructor.name).toBe('AsyncFunction')
    })

    it('should wait until React has rendered a root', async () => {
        vi.useFakeTimers()
        api().findRoots.mockReturnValue([])
        let loaded = false
        const loading = waitToLoadReact().then(() => {
            loaded = true
        })

        await vi.advanceTimersByTimeAsync(400)
        expect(loaded).toBe(false)

        /**
         * `createRoot` marks the container before the app calls `render`
         */
        const roots = [{ tag: 3, child: null }, { tag: 3, child: null }]
        api().findRoots.mockReturnValue(roots)
        await vi.advanceTimersByTimeAsync(400)
        expect(loaded).toBe(false)
        expect(api().isRendered.mock.calls.map((call: unknown[]) => call[0])).toContain(roots[1])

        /**
         * one rendered root is enough
         */
        api().isRendered.mockImplementation((root: unknown) => root === roots[1])
        await vi.advanceTimersByTimeAsync(200)
        await loading

        expect(loaded).toBe(true)
    })

    it('should stop to wait after 5 seconds when the page has no React root', async () => {
        vi.useFakeTimers()
        api().findRoots.mockReturnValue([])
        let loaded = false
        const loading = waitToLoadReact().then(() => {
            loaded = true
        })

        await vi.advanceTimersByTimeAsync(4800)
        expect(loaded).toBe(false)
        await vi.advanceTimersByTimeAsync(400)
        await loading

        expect(loaded).toBe(true)
    })
})
