/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * React component queries for `react$` and `react$$`. The compiler bundles this
 * file into `WDIO_REACT_SCRIPT`, which the commands inject into the page.
 *
 * The fiber lookup reads the root of the tree from a DOM node and takes `current`
 * of that root, so that a query sees the current render: React keeps two copies of
 * each fiber and uses the other copy after each update (#15879).
 *
 * The query rules are the rules of resq 1.11, which these commands used before, so
 * that a selector finds the same components:
 * - a selector is a list of component names separated by spaces, each one a
 *   descendant of the one before; `*` matches one or more characters;
 * - the name of a higher-order component `withX(Name)` is `Name`;
 * - `props` and `state` match when each key that the component also has matches,
 *   and a nested object matches the same way.
 * One difference: `react$` applies both `props` and `state`. resq ignored `props`
 * when `state` was also given.
 *
 * The code reads React internals that are the same from React 16 to 19: the
 * `HostRoot` tag (`3`), `stateNode.current`, `return`, `child`, `sibling`,
 * `memoizedProps`, `memoizedState`, and the `__reactFiber$`,
 * `__reactInternalInstance$`, `__reactContainer$` and `_reactRootContainer` keys.
 * The wait also reads `alternate` and `pendingLanes` of the root (React 17 and
 * later).
 */
type HostNode = HTMLElement | Text

/**
 * the fields of a React fiber that this script reads
 */
export interface Fiber {
    tag: number
    type?: unknown
    stateNode?: any
    return?: Fiber | null
    alternate?: Fiber | null
    child?: Fiber | null
    sibling?: Fiber | null
    memoizedProps?: unknown
    memoizedState?: unknown
}

const HOST_ROOT = 3

export interface ReactNode {
    name?: unknown
    props?: unknown
    state?: unknown
    children: ReactNode[]
    node?: HostNode | HostNode[] | null
    isFragment?: boolean
}

export interface ReactQueryApi {
    findRoots: () => Fiber[]
    findFiber: (scope: HTMLElement) => Fiber | undefined
    isRendered: (root?: Fiber) => boolean
    query: (selector: string, props: unknown, state: unknown, fiber: Fiber) => ReactNode[]
}

const isHostNode = (value: unknown): value is HostNode => (
    value instanceof HTMLElement || value instanceof Text
)

/**
 * `null` counts as an object, as in resq
 */
const isObject = (value: unknown): value is Record<string, unknown> => (
    typeof value === 'object' && !Array.isArray(value)
)

/**
 * an object that a filter goes into, key by key
 */
const isNestedObject = (value: unknown): value is Record<string, unknown> => (
    value !== null && isObject(value)
)

const keysOf = (value: unknown) => Object.keys(value as object)

const withoutChildren = (props: unknown) => {
    if (!props || typeof props === 'string') {
        return props
    }
    const copy: Record<PropertyKey, unknown> = {}
    for (const key of Reflect.ownKeys(props as object)) {
        if (Object.getOwnPropertyDescriptor(props, key)?.enumerable) {
            copy[key] = (props as Record<PropertyKey, unknown>)[key]
        }
    }
    delete copy.children
    return copy
}

/**
 * hooks keep the state of the first hook in `baseState`
 */
const stateOf = (memoizedState: unknown) => {
    if (!memoizedState) {
        return undefined
    }
    return (memoizedState as { baseState?: unknown }).baseState || memoizedState
}

const arraysOverlap = (filter: unknown, value: unknown) => (
    Array.isArray(filter) && Array.isArray(value) && filter.some((item) => value.includes(item))
)

const matches = (filter: unknown = {}, value: unknown = {}): boolean => {
    if (!keysOf(filter).length) {
        return true
    }
    if (value === null || !keysOf(value).length) {
        return false
    }
    const filterObject = filter as Record<string, unknown>
    const valueObject = value as Record<string, unknown>
    const keys = keysOf(filterObject).filter((key) => keysOf(valueObject).includes(key))
    const results: unknown[] = []
    for (const key of keys) {
        if (isNestedObject(filterObject[key]) && isNestedObject(valueObject[key])) {
            results.push(matches(filterObject[key], valueObject[key]))
        }
        if (filterObject[key] === valueObject[key] || arraysOverlap(filterObject[key], valueObject[key])) {
            results.push(valueObject)
        }
    }
    return results.length > 0 && results.filter(Boolean).length === keys.length
}

const buildTree = (fiber: Fiber | null | undefined): ReactNode => {
    const tree: ReactNode = { children: [] }
    if (!fiber) {
        return tree
    }
    const type = fiber.type as { displayName?: string, name?: string } | string | null
    tree.name = typeof type === 'function'
        ? (type as { displayName?: string }).displayName || (type as { name?: string }).name
        : type
    tree.props = withoutChildren(fiber.memoizedProps)
    tree.state = stateOf(fiber.memoizedState)

    for (let child = fiber.child; child; child = child.sibling) {
        tree.children.push(buildTree(child))
    }

    /**
     * A child can be a fragment too: its nodes go into the same flat list, in order
     * (resq made a nested list, so `react$` could return a list).
     */
    if (typeof fiber.type === 'function' && tree.children.length > 1) {
        tree.node = tree.children.flatMap((child) => child.node || [])
        tree.isFragment = true
    } else if (isHostNode(fiber.stateNode)) {
        tree.node = fiber.stateNode
    } else {
        tree.node = fiber.child && isHostNode(fiber.child.stateNode) ? fiber.child.stateNode : null
    }
    return tree
}

/**
 * the first DOM node in the subtree, breadth first
 */
const firstNode = (queue: ReactNode[]) => {
    while (queue.length) {
        const tree = queue.shift() as ReactNode
        if (tree.node) {
            return tree.node
        }
        queue.push(...tree.children)
    }
}

const findDescendants = (roots: ReactNode[], predicate: (tree: ReactNode) => boolean) => {
    const queue = [...roots]
    const found: ReactNode[] = []
    while (queue.length) {
        for (const child of (queue.shift() as ReactNode).children) {
            if (predicate(child)) {
                if (!child.node) {
                    child.node = firstNode([...child.children])
                }
                found.push(child)
            }
            queue.push(child)
        }
    }
    return found
}

const nameMatches = (selector: string, name: unknown) => {
    let componentName = name as string | undefined
    if (typeof componentName === 'string' && componentName.includes('(')) {
        componentName = componentName.split('(').find((part) => part.includes(')'))?.replace(/\)*/g, '')
    }
    const pattern = selector.split('*').map((part) => part.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1')).join('.+')
    return new RegExp(`^${pattern}$`).test(componentName as string)
}

const filterBy = (trees: ReactNode[], key: 'props' | 'state', filter: unknown) => {
    if (typeof filter === 'function') {
        console.warn('Functions are not supported as filter matchers')
        return []
    }
    return trees.filter((tree) => (
        (isObject(filter) && matches(filter, tree[key])) ||
        (Array.isArray(filter) && arraysOverlap(filter, tree[key])) ||
        tree[key] === filter
    ))
}

const query = (selector: string, props: unknown, state: unknown, fiber: Fiber) => {
    const selectors = selector.split(' ').filter(Boolean).map((part) => part.trim())
    let trees = selectors.reduce<ReactNode[]>((roots, part) => findDescendants(roots, (tree) => (
        typeof tree.name === 'string'
            ? nameMatches(part, tree.name)
            : tree.name !== null && typeof tree.name === 'object' && nameMatches(part, (tree.name as { displayName?: string }).displayName)
    )), [buildTree(fiber)])

    if (props && keysOf(props).length) {
        trees = filterBy(trees, 'props', props)
    }
    if (state && keysOf(state).length) {
        trees = filterBy(trees, 'state', state)
    }
    return trees
}

const isReactKey = (key: string) => (
    key.startsWith('__reactFiber$') ||
    key.startsWith('__reactInternalInstance$') ||
    key.startsWith('__reactContainer$')
)

const isContainer = (node: Element) => (
    Boolean((node as { _reactRootContainer?: unknown })._reactRootContainer) ||
    Object.keys(node).some((key) => key.startsWith('__reactContainer$'))
)

/**
 * the elements of the document and of its open shadow roots, in document order
 */
function* elementsOf (root: Document | ShadowRoot): Generator<Element> {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        yield node as Element
        if ((node as Element).shadowRoot) {
            yield* elementsOf((node as Element).shadowRoot as ShadowRoot)
        }
    }
}

/**
 * For `waitToLoadReact`: a root that React has rendered, also when the app renders
 * nothing. The root fiber gets its other copy (`alternate`) when the first render
 * starts, so a first render that suspends without a `Suspense` boundary also has
 * one: it has not committed while the root has pending lanes (React 17 and later;
 * a root of React 16 commits its render at once). A root that rendered nothing and
 * has an update pending also has pending lanes: the wait goes on until that update
 * commits. React keeps no field that tells if a root has committed once.
 */
const isRendered = (root?: Fiber) => Boolean(root && (
    root.child ||
    (root.alternate && !root.stateNode.pendingLanes)
))

/**
 * The current root fibers of the page, in document order, also in open shadow
 * roots. A query without a scope searches all of them: a root that has not
 * rendered yet, that is suspended, that renders nothing or that was unmounted adds
 * nothing, so no rule must choose one root from a state that changes while React
 * works. A root of `createRoot` marks its container before `render` and keeps the
 * mark after `unmount` (with no fiber).
 */
const findRoots = () => {
    const roots: Fiber[] = []
    for (const node of elementsOf(document)) {
        const root = isContainer(node) ? currentRootOf(node) : undefined
        if (root && !roots.includes(root)) {
            roots.push(root)
        }
    }
    return roots
}

/**
 * the `HostRoot` fiber of the current render, from any node of the tree
 */
const currentRootOf = (node: any): Fiber | undefined => {
    /**
     * `ReactDOM.render`: `{ _internalRoot }` in React 16 and 17, the root itself in React 18
     */
    const legacyRoot = node._reactRootContainer
    if (legacyRoot) {
        return (legacyRoot._internalRoot || legacyRoot).current
    }
    /**
     * The container of a root inside another root also has the fiber of the outer
     * root: the key of its own root comes first.
     */
    const keys = Object.keys(node)
    const key = keys.find((name) => name.startsWith('__reactContainer$')) || keys.find(isReactKey)
    let fiber: Fiber | undefined = key ? node[key] : undefined
    while (fiber && fiber.return) {
        fiber = fiber.return
    }
    return fiber && fiber.tag === HOST_ROOT ? fiber.stateNode.current : undefined
}

/**
 * the fiber of `scope` in the current render
 */
const findFiber = (scope: HTMLElement): Fiber | undefined => {
    const root = currentRootOf(scope)
    if (!root || root.stateNode.containerInfo === scope) {
        return root
    }

    const fibers = [root]
    while (fibers.length) {
        const fiber = fibers.pop() as Fiber
        if (fiber.stateNode === scope) {
            return fiber
        }
        if (fiber.sibling) {
            fibers.push(fiber.sibling)
        }
        if (fiber.child) {
            fibers.push(fiber.child)
        }
    }
}

;(window as unknown as { __wdioReact?: ReactQueryApi }).__wdioReact = { findRoots, findFiber, isRendered, query }
