/**
 * @vitest-environment jsdom
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import * as resq from 'resq'

import type { Fiber, ReactNode, ReactQueryApi } from '../../src/injected/react.js'
import { react$, react$$ } from '../../src/scripts/react.js'

const require = createRequire(import.meta.url)

const api = () => (window as unknown as { __wdioReact: ReactQueryApi }).__wdioReact

beforeAll(async () => {
    await import('../../src/injected/react.js')
})

/**
 * The fiber lookup with hand-made fibers: React keeps two copies of each fiber, the
 * current one and the one of the previous render, and stores one of them on the
 * DOM node.
 */
describe('findFiber', () => {
    const HOST_ROOT = 3
    const HOST_COMPONENT = 5

    const createTree = () => {
        const container = document.createElement('div')
        const list = document.createElement('ul')
        container.appendChild(list)
        document.body.appendChild(container)

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

    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('should find the current tree of a createRoot app (React 18 and 19)', () => {
        const { container, list, current, previous, currentList, previousList } = createTree()
        Object.assign(container, { __reactContainer$abc: previous })
        Object.assign(list, { __reactFiber$abc: previousList })

        expect(api().findContainer()).toBe(container)
        expect(api().findFiber()).toBe(current)
        expect(api().findFiber(container)).toBe(current)
        expect(api().findFiber(list)).toBe(currentList)
    })

    it('should find the current tree of a ReactDOM.render app (React 16 and 17)', () => {
        const { container, list, fiberRoot, current, previousList, currentList } = createTree()
        Object.assign(container, { _reactRootContainer: { _internalRoot: fiberRoot } })
        Object.assign(list, { __reactInternalInstance$abc: previousList })

        expect(api().findFiber()).toBe(current)
        expect(api().findFiber(container)).toBe(current)
        expect(api().findFiber(list)).toBe(currentList)
    })

    it('should find the current tree of a ReactDOM.render app (React 18)', () => {
        const { container, list, fiberRoot, current, previousList, currentList } = createTree()
        Object.assign(container, { _reactRootContainer: fiberRoot })
        Object.assign(list, { __reactFiber$abc: previousList })

        expect(api().findFiber()).toBe(current)
        expect(api().findFiber(container)).toBe(current)
        expect(api().findFiber(list)).toBe(currentList)
    })

    it('should find no fiber for an element that React did not render', () => {
        const { container, previous } = createTree()
        Object.assign(container, { __reactContainer$abc: previous })

        expect(api().findFiber(document.createElement('div'))).toBeUndefined()
    })

    it('should find no root on a page without React', () => {
        expect(api().findContainer()).toBeUndefined()
        expect(api().findFiber()).toBeUndefined()
    })
})

/**
 * The React builds of the matrix. They run in the jsdom window, as in a browser, so
 * each React DOM uses the React of its own version: the UMD builds of React 16 to
 * 18, and the CommonJS files of React 19, which has no UMD build.
 */
type Mount = 'render' | 'hydrate' | 'createRoot' | 'hydrateRoot'
interface ReactApi {
    React: any
    ReactDOM: any
    ReactDOMServer: any
}
interface ReactBuild {
    version: string
    mounts: Mount[]
    load: () => ReactApi
}

const packageDir = (pkg: string) => path.dirname(require.resolve(`${pkg}/package.json`))

const loadUmd = (react: string, reactDom: string, server: string) => (): ReactApi => {
    for (const name of ['React', 'ReactDOM', 'ReactDOMServer']) {
        delete (globalThis as any)[name]
    }
    for (const file of [
        path.join(packageDir(react), 'umd', 'react.production.min.js'),
        path.join(packageDir(reactDom), 'umd', 'react-dom.production.min.js'),
        path.join(packageDir(reactDom), 'umd', server)
    ]) {
        // eslint-disable-next-line no-new-func
        new Function(fs.readFileSync(file, 'utf8')).call(globalThis)
    }
    const { React, ReactDOM, ReactDOMServer } = globalThis as any
    return { React, ReactDOM, ReactDOMServer }
}

/**
 * a small CommonJS module loader for the React 19 files
 */
const loadReact19 = (): ReactApi => {
    const reactDomDir = packageDir('react-dom-19')
    const files: Record<string, string> = {
        react: path.join(packageDir('react-19'), 'cjs', 'react.production.js'),
        'react-dom': path.join(reactDomDir, 'cjs', 'react-dom.production.js'),
        'react-dom/client': path.join(reactDomDir, 'cjs', 'react-dom-client.production.js'),
        'react-dom/server': path.join(reactDomDir, 'cjs', 'react-dom-server-legacy.browser.production.js'),
        scheduler: path.join(path.dirname(createRequire(path.join(reactDomDir, 'package.json')).resolve('scheduler/package.json')), 'cjs', 'scheduler.production.js')
    }
    const cache: Record<string, { exports: any }> = {}
    const load = (name: string) => {
        if (!cache[name]) {
            cache[name] = { exports: {} }
            // eslint-disable-next-line no-new-func
            new Function('module', 'exports', 'require', fs.readFileSync(files[name], 'utf8'))(cache[name], cache[name].exports, load)
        }
        return cache[name].exports
    }
    return {
        React: load('react'),
        ReactDOM: { ...load('react-dom'), ...load('react-dom/client') },
        ReactDOMServer: load('react-dom/server')
    }
}

const BUILDS: ReactBuild[] = [
    { version: '16', mounts: ['render', 'hydrate'], load: loadUmd('react-16', 'react-dom-16', 'react-dom-server.browser.production.min.js') },
    { version: '17', mounts: ['render', 'hydrate'], load: loadUmd('react-17', 'react-dom-17', 'react-dom-server.browser.production.min.js') },
    { version: '18', mounts: ['render', 'hydrate', 'createRoot', 'hydrateRoot'], load: loadUmd('react', 'react-dom', 'react-dom-server-legacy.browser.production.min.js') },
    { version: '19', mounts: ['createRoot', 'hydrateRoot'], load: loadReact19 }
]

const loadReact = (build: ReactBuild) => {
    const api = build.load()
    expect(api.React.version.split('.')[0]).toBe(build.version)
    expect(api.ReactDOM.version.split('.')[0]).toBe(build.version)
    return api
}

/**
 * One app with each kind of component. `controls` changes the state after the
 * first render. The server renderer of React 16 and 17 supports neither portals nor
 * Suspense, so a hydrated app leaves them out.
 */
const createFixture = (React: any, ReactDOM: any, { portal, suspense }: { portal: HTMLElement | null, suspense: boolean }) => {
    const h = React.createElement
    const controls: Record<string, (...args: any[]) => void> = {}

    function Item (props: { color: string }) {
        return h('li', { className: 'item', 'data-color': props.color }, props.color)
    }
    function List (props: { name: string, children: unknown }) {
        return h('ul', { id: 'list' }, props.children)
    }
    class Header extends React.Component {
        constructor (props: unknown) {
            super(props)
            this.state = { title: 'Shop', open: true }
            controls.closeHeader = () => this.setState({ open: false })
        }
        render () {
            return h('header', { id: 'header' }, this.state.title)
        }
    }
    function Toggle () {
        const [settings, setSettings] = React.useState({ open: true, step: 2 })
        React.useState(5)
        controls.closeToggle = () => setSettings({ open: false, step: 2 })
        return h('button', { id: 'toggle' }, String(settings.open))
    }
    const MemoItem = React.memo(function MemoLabel (props: { label: string }) {
        return h('em', { id: 'memo' }, props.label)
    })
    const FancyInput = React.forwardRef(function FancyInput (_: unknown, ref: unknown) {
        return h('input', { id: 'fancy', ref })
    })
    function Badge () {
        return h('b', { id: 'badge' }, 'badge')
    }
    const withLabel = (Component: unknown) => {
        function WithLabel () {
            return h(Component)
        }
        WithLabel.displayName = 'withLabel(Badge)'
        return WithLabel
    }
    const LabelledBadge = withLabel(Badge)
    function Named () {
        return h('s', { id: 'named' }, 'named')
    }
    Named.displayName = 'CustomName'
    function Pair () {
        return h(React.Fragment, null, h('dt', { id: 'dt' }, 'term'), h('dd', { id: 'dd' }, 'definition'))
    }
    function Wrapper () {
        return h(Pair)
    }
    function Terms () {
        return h(React.Fragment, null, h('dt', { id: 'term2' }, 'term'), h('dd', { id: 'def2' }, 'definition'))
    }
    function Glossary () {
        return h(React.Fragment, null, h(Terms), h('dd', { id: 'note' }, 'note'))
    }
    function Empty () {
        return null
    }
    function TextOnly () {
        return 'plain text'
    }
    const Context = React.createContext('none')
    function UsesContext () {
        return h('q', { id: 'ctx' }, React.useContext(Context))
    }
    function SuspenseChild () {
        return h('u', { id: 'suspense-child' }, 'loaded')
    }
    function PortalItem () {
        return h('p', { id: 'portal-item' }, 'portal')
    }

    function App () {
        const [colors, setColors] = React.useState(['red', 'blue', 'red'])
        controls.addItem = (color: string) => setColors((list: string[]) => list.concat(color))
        controls.removeItem = () => setColors((list: string[]) => list.slice(0, -1))
        controls.recolor = (index: number, color: string) => setColors((list: string[]) => list.map((c, i) => i === index ? color : c))
        return h('main', null,
            h(Header, { level: 1 }),
            h(List, { name: 'fruits' }, colors.map((color: string, index: number) => h(Item, {
                key: index,
                color,
                tags: ['a', 'b'],
                meta: { size: 'L', shape: { round: true } }
            }))),
            h(Toggle),
            h(MemoItem, { label: 'memo' }),
            h(FancyInput),
            h(LabelledBadge),
            h(Named),
            h('dl', null, h(Wrapper)),
            h('dl', { id: 'glossary' }, h(Glossary)),
            h(Empty),
            h('span', { id: 'text' }, h(TextOnly)),
            h(Context.Provider, { value: 'provided' }, h(UsesContext)),
            suspense ? h(React.Suspense, { fallback: null }, h(SuspenseChild)) : null,
            portal ? ReactDOM.createPortal(h(PortalItem), portal) : null
        )
    }
    function SecondApp () {
        return h('ol', { id: 'list2' }, h(Item, { color: 'other' }))
    }
    return { App, SecondApp, controls }
}

const mountApp = (mount: Mount, ReactDOM: any, ReactDOMServer: any, element: unknown, container: HTMLElement) => {
    if (mount === 'render') {
        ReactDOM.render(element, container)
        return () => ReactDOM.unmountComponentAtNode(container)
    }
    if (mount === 'hydrate') {
        container.innerHTML = ReactDOMServer.renderToString(element)
        ReactDOM.hydrate(element, container)
        return () => ReactDOM.unmountComponentAtNode(container)
    }
    if (mount === 'createRoot') {
        const root = ReactDOM.createRoot(container)
        ReactDOM.flushSync(() => root.render(element))
        return () => root.unmount()
    }
    container.innerHTML = ReactDOMServer.renderToString(element)
    let root: any
    ReactDOM.flushSync(() => {
        root = ReactDOM.hydrateRoot(container, element)
    })
    return () => root.unmount()
}

/**
 * The nodes of the components that resq 1.11 finds, flattened as the commands
 * did. `react$` used `resq$`, which ignores `props` when `state` is also given.
 */
const resqNodes = (root: Fiber, selector: string, props: unknown = {}, state: unknown = {}) => {
    Object.assign(globalThis, { isReactLoaded: true, rootReactElement: root })
    let found: any = (resq as any).resq$$(selector)
    if (Object.keys(props as object).length) {
        found = found.byProps(props)
    }
    if (Object.keys(state as object).length) {
        found = found.byState(state)
    }
    /**
     * resq nests the nodes of a fragment inside a fragment
     */
    return (found as ReactNode[]).flatMap((tree) => [tree.node].flat(Infinity).filter(Boolean))
}

const ourNodes = (root: Fiber, selector: string, props: unknown = {}, state: unknown = {}) => (
    api().query(selector, props, state, root).flatMap((tree) => [tree.node].flat().filter(Boolean))
)

/**
 * A case: what `react$$` must give, as DOM nodes found without React. The results
 * come in the order of the component tree, breadth first, as in resq: not in the
 * order of the document.
 */
interface QueryCase {
    title: string
    selector: string
    props?: Record<string, unknown>
    state?: Record<string, unknown>
    expected: () => Node[]
    /**
     * what `react$$` gives, when it is not `expected`: it gives each node once
     */
    commandExpected?: () => Node[]
    needs?: 'portal' | 'suspense'
}

const byId = (id: string) => document.getElementById(id) as HTMLElement
const items = () => [...document.querySelectorAll('#root li.item')]

const QUERY_CASES: QueryCase[] = [
    { title: 'a function component', selector: 'Item', expected: items },
    { title: 'a wildcard at the end', selector: 'It*', expected: items },
    { title: 'a wildcard at the start (one or more characters)', selector: '*tem', expected: () => [...(byId('portal-item') ? [byId('portal-item')] : []), ...items()] },
    { title: 'a wildcard in the middle', selector: 'Me*el', expected: () => [byId('memo')] },
    { title: 'a nested selector', selector: 'List Item', expected: items },
    { title: 'a nested selector with a wildcard', selector: 'App L* It*', expected: items },
    { title: 'a nested selector that does not match', selector: 'Header Item', expected: () => [] },
    { title: 'a class component', selector: 'Header', expected: () => [byId('header')] },
    { title: 'class state', selector: 'Header', state: { open: true }, expected: () => [byId('header')] },
    { title: 'class state that does not match', selector: 'Header', state: { open: false }, expected: () => [] },
    { title: 'a filter key that the component does not have (ignored)', selector: 'Header', state: { title: 'Shop', missing: 1 }, expected: () => [byId('header')] },
    { title: 'props', selector: 'Item', props: { color: 'blue' }, expected: () => items().filter((li) => li.getAttribute('data-color') === 'blue') },
    { title: 'props with more than one match', selector: 'Item', props: { color: 'red' }, expected: () => items().filter((li) => li.getAttribute('data-color') === 'red') },
    { title: 'nested props (partial)', selector: 'Item', props: { meta: { size: 'L' } }, expected: items },
    { title: 'deeply nested props', selector: 'Item', props: { meta: { shape: { round: true } } }, expected: items },
    { title: 'nested props that do not match', selector: 'Item', props: { meta: { size: 'S' } }, expected: () => [] },
    { title: 'array props (one common value)', selector: 'Item', props: { tags: ['b', 'z'] }, expected: items },
    { title: 'array props (no common value)', selector: 'Item', props: { tags: ['z'] }, expected: () => [] },
    { title: 'props of a parent', selector: 'List', props: { name: 'fruits' }, expected: () => [byId('list')] },
    { title: 'the state of the first hook', selector: 'Toggle', state: { open: true }, expected: () => [byId('toggle')] },
    { title: 'a memo component (by the name of its function)', selector: 'MemoLabel', expected: () => [byId('memo')] },
    { title: 'a forwardRef component (no name, as in resq)', selector: 'FancyInput', expected: () => [] },
    { title: 'a higher-order component and its child', selector: 'Badge', expected: () => [byId('badge'), byId('badge')], commandExpected: () => [byId('badge')] },
    { title: 'a displayName', selector: 'CustomName', expected: () => [byId('named')] },
    { title: 'a function name hidden by its displayName', selector: 'Named', expected: () => [] },
    { title: 'a fragment', selector: 'Pair', expected: () => [byId('dt'), byId('dd')] },
    { title: 'a component without a DOM node of its own', selector: 'Wrapper', expected: () => [byId('dt'), byId('dd')] },
    { title: 'a fragment that contains a fragment', selector: 'Glossary', expected: () => [byId('term2'), byId('def2'), byId('note')] },
    { title: 'a fragment inside a fragment', selector: 'Terms', expected: () => [byId('term2'), byId('def2')] },
    { title: 'a component that renders nothing', selector: 'Empty', expected: () => [] },
    { title: 'a component that renders text', selector: 'TextOnly', expected: () => [byId('text').firstChild as Node] },
    { title: 'a context consumer', selector: 'UsesContext', expected: () => [byId('ctx')] },
    { title: 'a child of Suspense', selector: 'SuspenseChild', expected: () => [byId('suspense-child')], needs: 'suspense' },
    { title: 'a component in a portal', selector: 'PortalItem', expected: () => [byId('portal-item')], needs: 'portal' },
    { title: 'a name that does not exist', selector: 'Nope', expected: () => [] }
]

for (const build of BUILDS) {
    for (const mount of build.mounts) {
        describe(`React ${build.version} ${mount}`, () => {
            const hydrated = mount === 'hydrate' || mount === 'hydrateRoot'
            const hasSuspense = !hydrated || build.version !== '16' && build.version !== '17'
            const hasPortal = !hydrated
            let ReactDOM: any
            let controls: Record<string, (...args: any[]) => void>
            let unmount: (() => void)[] = []

            const update = (change: () => void) => (ReactDOM.flushSync ? ReactDOM.flushSync(change) : change())
            const root = () => api().findFiber() as Fiber

            beforeAll(async () => {
                document.body.innerHTML = '<div id="root"></div><div id="root2"></div><div id="portal"></div><div id="plain"></div>'
                const loaded = loadReact(build)
                ReactDOM = loaded.ReactDOM
                const fixture = createFixture(loaded.React, ReactDOM, {
                    portal: hasPortal ? byId('portal') : null,
                    suspense: hasSuspense
                })
                controls = fixture.controls
                const h = loaded.React.createElement
                unmount = [
                    mountApp(mount, ReactDOM, loaded.ReactDOMServer, h(fixture.App), byId('root')),
                    mountApp(mount, ReactDOM, loaded.ReactDOMServer, h(fixture.SecondApp), byId('root2'))
                ]

                /**
                 * `hydrateRoot` hydrates a Suspense boundary later, at a low priority. Until
                 * then, its children have no fiber, for resq as for this script.
                 */
                if (mount === 'hydrateRoot') {
                    await vi.waitFor(() => expect(resqNodes(root(), 'SuspenseChild')).toHaveLength(1))
                }
            })

            afterAll(() => {
                unmount.forEach((fn) => fn())
                document.body.innerHTML = ''
            })

            it('renders the fixture', () => {
                expect(items().map((li) => li.textContent)).toEqual(['red', 'blue', 'red'])
                expect(byId('header').textContent).toBe('Shop')
            })

            for (const testCase of QUERY_CASES) {
                const skip = (testCase.needs === 'portal' && !hasPortal) || (testCase.needs === 'suspense' && !hasSuspense)
                it.skipIf(skip)(`finds ${testCase.title}: ${testCase.selector}`, () => {
                    const expected = testCase.expected()
                    const nodes = ourNodes(root(), testCase.selector, testCase.props, testCase.state)
                    expect(nodes).toEqual(expected)
                    expect(nodes).toEqual(resqNodes(root(), testCase.selector, testCase.props, testCase.state))
                    expect(react$$(testCase.selector, testCase.props || {}, testCase.state || {})).toEqual(testCase.commandExpected?.() || expected)
                })
            }

            it('react$ gives the first node, the first node of a fragment, null or a message', () => {
                expect(react$('Item', {}, {})).toBe(items()[0])
                expect(react$('Item', { color: 'blue' }, {})).toBe(items()[1])
                expect(react$('Pair', {}, {})).toBe(byId('dt'))
                expect(react$('Wrapper', {}, {})).toBe(byId('dt'))
                expect(react$('Glossary', {}, {})).toBe(byId('term2'))
                expect(react$('Empty', {}, {})).toBeUndefined()
                expect(react$('Nope', {}, {})).toEqual({ message: 'React element with selector "Nope" wasn\'t found' })
            })

            it('react$ applies both props and state (resq ignored props)', () => {
                expect(react$('Header', { level: 2 }, { open: true })).toEqual({ message: 'React element with selector "Header" wasn\'t found' })
                expect(react$('Header', { level: 1 }, { open: true })).toBe(byId('header'))
                Object.assign(globalThis, { isReactLoaded: true, rootReactElement: root() })
                expect((resq as any).resq$('Header').byProps({ level: 2 }).byState({ open: true }).node).toBe(byId('header'))
            })

            it('scopes the query to an element', () => {
                expect(react$$('Item', {}, {}, byId('list'))).toEqual(items())
                expect(react$$('Item', {}, {}, byId('root'))).toEqual(items())
                expect(react$$('Item', {}, {}, byId('header'))).toEqual([])
                expect(react$$('Item', {}, {}, byId('root2'))).toEqual([...document.querySelectorAll('#list2 li')])
                expect(react$$('Item', {}, {}, byId('list2'))).toEqual([...document.querySelectorAll('#list2 li')])
                expect(react$('Item', {}, {}, byId('list2'))).toBe(document.querySelector('#list2 li'))
            })

            it('uses the first root without a scope', () => {
                expect(api().findContainer()).toBe(byId('root'))
                expect(react$$('Item', { color: 'other' }, {})).toEqual([])
            })

            it('fails for an element that React did not render', () => {
                expect(() => react$$('Item', {}, {}, byId('plain'))).toThrow('Could not find instance of React in given element')
                expect(() => react$('Item', {}, {}, byId('plain'))).toThrow('Could not find instance of React in given element')
            })

            it.skipIf(!hasPortal)('scopes the query to a portal container', () => {
                expect(() => react$$('PortalItem', {}, {}, byId('portal'))).toThrow('Could not find instance of React in given element')
                expect(react$$('PortalItem', {}, {}, byId('portal-item'))).toEqual([])
            })

            it('sees the current render after each update', () => {
                const list = byId('list')
                update(() => controls.addItem('green'))
                expect(react$$('Item', {}, {})).toEqual(items())
                expect(items()).toHaveLength(4)
                expect(react$$('Item', {}, {}, list)).toHaveLength(4)
                expect(react$$('Item', { color: 'green' }, {})).toEqual([items()[3]])

                update(() => controls.recolor(0, 'purple'))
                expect(react$$('Item', { color: 'purple' }, {})).toEqual([items()[0]])
                expect(react$$('Item', { color: 'red' }, {})).toEqual([items()[2]])

                update(() => controls.removeItem())
                expect(react$$('Item', {}, {})).toEqual(items())
                expect(items()).toHaveLength(3)
                expect(react$$('Item', { color: 'green' }, {})).toEqual([])

                update(() => controls.closeHeader())
                expect(react$$('Header', {}, { open: false })).toEqual([byId('header')])
                expect(react$$('Header', {}, { open: true })).toEqual([])

                update(() => controls.closeToggle())
                expect(react$$('Toggle', {}, { open: false })).toEqual([byId('toggle')])

                /**
                 * a second update of the same component uses the other copy of each fiber
                 */
                update(() => controls.addItem('black'))
                update(() => controls.addItem('white'))
                expect(react$$('Item', {}, {})).toEqual(items())
                expect(items()).toHaveLength(5)
                expect(ourNodes(root(), 'Item')).toEqual(resqNodes(root(), 'Item'))
            })
        })
    }
}

/**
 * `waitToLoadReact` waits for a child of the root: `createRoot` marks the
 * container before the app calls `render`
 */
for (const build of BUILDS.filter((build) => build.mounts.includes('createRoot'))) {
    it(`React ${build.version}: a createRoot root has a child only after render`, () => {
        document.body.innerHTML = '<div id="late"></div>'
        const { React, ReactDOM } = loadReact(build)
        const root = ReactDOM.createRoot(byId('late'))

        expect(api().findContainer()).toBe(byId('late'))
        expect(api().findFiber()?.child).toBeNull()
        ReactDOM.flushSync(() => root.render(React.createElement('p', null, 'late')))
        expect(api().findFiber()?.child).toBeTruthy()

        root.unmount()
        document.body.innerHTML = ''
    })
}
