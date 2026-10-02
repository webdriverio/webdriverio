/* eslint-disable @typescript-eslint/no-explicit-any */
import type resq from 'resq'

interface ReactFiber {
    tag: number
    return?: ReactFiber
    child?: ReactFiber
    sibling?: ReactFiber
    stateNode?: any
}

interface CustomWindow extends Window {
    resq: typeof resq
    /**
     * resq uses these two values when it gets no element
     */
    isReactLoaded?: boolean
    rootReactElement?: ReactFiber
    wdioReactFiber?: (scope?: HTMLElement) => ReactFiber | undefined
}

declare let window: CustomWindow

/**
 * resq finds the React root only with the React 16 and 17 structure, and it uses the
 * fiber that React stored on a DOM node. React keeps two copies of each fiber and uses
 * the other copy after each update, so that fiber can be one update old (#15879).
 *
 * This script installs `window.wdioReactFiber`. It finds the root of the tree from any
 * React node, then takes `current` of that root, which is always the current tree. Then
 * it waits until the page has a React root, for at most 5 seconds as resq does.
 */
export const waitToLoadReact = function waitToLoadReact () {
    const HOST_ROOT = 3
    const isReactKey = (key: string) => (
        key.startsWith('__reactFiber$') ||
        key.startsWith('__reactInternalInstance$') ||
        key.startsWith('__reactContainer$')
    )
    const isContainer = (node: any) => (
        Boolean(node._reactRootContainer) ||
        Object.keys(node).some((key) => key.startsWith('__reactContainer$'))
    )
    const findContainer = () => {
        const walker = document.createTreeWalker(document, NodeFilter.SHOW_ELEMENT)
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            if (isContainer(node)) {
                return node as HTMLElement
            }
        }
    }
    const currentRootOf = (node: any): ReactFiber | undefined => {
        /**
         * `ReactDOM.render`: `{ _internalRoot }` in React 16 and 17, the root itself in React 18
         */
        const legacyRoot = node._reactRootContainer
        if (legacyRoot) {
            return (legacyRoot._internalRoot || legacyRoot).current
        }
        const key = Object.keys(node).find(isReactKey)
        let fiber: ReactFiber | undefined = key ? node[key] : undefined
        while (fiber && fiber.return) {
            fiber = fiber.return
        }
        return fiber && fiber.tag === HOST_ROOT ? fiber.stateNode.current : undefined
    }

    window.wdioReactFiber = (scope?: HTMLElement) => {
        if (!scope) {
            const container = findContainer()
            return container && currentRootOf(container)
        }

        const root = currentRootOf(scope)
        if (!root || root.stateNode.containerInfo === scope) {
            return root
        }

        const fibers = [root]
        while (fibers.length) {
            const fiber = fibers.pop() as ReactFiber
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

    return new Promise<void>((resolve) => {
        const start = Date.now()
        const check = () => {
            if (findContainer() || Date.now() - start >= 5000) {
                return resolve()
            }
            setTimeout(check, 200)
        }
        check()
    })
}

export const react$ = function react$ (
    selector: string,
    props: Record<string, unknown>,
    state: Record<string, unknown>,
    reactElement?: HTMLElement
) {
    props = props || {}
    state = state || {}

    /**
     * give resq the fiber of the current tree, see `waitToLoadReact`
     */
    const fiber = window.wdioReactFiber && window.wdioReactFiber(reactElement)
    if (!fiber) {
        throw new Error(reactElement
            ? 'Could not find instance of React in given element'
            : 'Could not find the root element of your application'
        )
    }
    window.isReactLoaded = true
    window.rootReactElement = fiber

    let element = window.resq.resq$(selector)

    if (Object.keys(props).length) {
        // not yet typed https://github.com/baruchvlz/resq/issues/69
        element = (element as any).byProps(props)
    }

    if (Object.keys(state).length) {
        // not yet typed https://github.com/baruchvlz/resq/issues/69
        element = (element as any).byState(state)
    }

    if (!element.name) {
        return { message: `React element with selector "${selector}" wasn't found` }
    }

    // resq returns an array of HTMLElements if the React component is a fragment
    // if the element is a fragment, we return the first child to be passed into the driver
    return element.isFragment && element.node
        ? (element.node as unknown as HTMLElement[])[0]
        : element.node
}

export const react$$ = function react$$ (
    selector: string,
    props: Record<string, unknown>,
    state: Record<string, unknown>,
    reactElement?: HTMLElement
) {
    /**
     * give resq the fiber of the current tree, see `waitToLoadReact`
     */
    const fiber = window.wdioReactFiber && window.wdioReactFiber(reactElement)
    if (!fiber) {
        throw new Error(reactElement
            ? 'Could not find instance of React in given element'
            : 'Could not find the root element of your application'
        )
    }
    window.isReactLoaded = true
    window.rootReactElement = fiber

    let elements = window.resq.resq$$(selector)

    if (Object.keys(props).length) {
        // not yet typed https://github.com/baruchvlz/resq/issues/69
        elements = (elements as any).byProps(props)
    }

    if (Object.keys(state).length) {
        // not yet typed https://github.com/baruchvlz/resq/issues/69
        elements = (elements as any).byState(state)
    }

    if (!elements.length) {
        return []
    }

    // resq returns an array of HTMLElements if the React component is a fragment
    // this avoids having nested arrays of nodes which the driver does not understand
    // [[div, div], [div, div]] => [div, div, div, div]
    let nodes: HTMLElement[] = []

    elements.forEach(function (element) {
        if (element.isFragment) {
            nodes = nodes.concat(element.node || [])
        } else if (element.node) {
            nodes.push(element.node)
        }
    })

    return [...nodes]
}
