import type { ReactNode, ReactQueryApi } from '../injected/react.js'

interface CustomWindow extends Window {
    /**
     * installed by `WDIO_REACT_SCRIPT` (`src/injected/react.ts`)
     */
    __wdioReact?: ReactQueryApi
}

declare let window: CustomWindow

/**
 * Wait until the page has a React root, for at most 5 seconds as resq did. An async
 * function, so that `execute` waits for it on WebDriver Classic sessions too.
 */
export const waitToLoadReact = async function waitToLoadReact () {
    return new Promise<void>((resolve) => {
        const start = Date.now()
        const check = () => {
            if ((window.__wdioReact && window.__wdioReact.findContainer()) || Date.now() - start >= 5000) {
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
    const api = window.__wdioReact
    const fiber = api && api.findFiber(reactElement)
    if (!api || !fiber) {
        throw new Error(reactElement
            ? 'Could not find instance of React in given element'
            : 'Could not find the root element of your application'
        )
    }

    const [element] = api.query(selector, props || {}, state || {}, fiber) as (ReactNode | undefined)[]
    if (!element) {
        return { message: `React element with selector "${selector}" wasn't found` }
    }

    /**
     * a fragment has more than one DOM node, and a component without its own DOM
     * node can take them from a fragment inside it: give the first one to the driver
     */
    return Array.isArray(element.node)
        ? element.node[0]
        : element.node
}

export const react$$ = function react$$ (
    selector: string,
    props: Record<string, unknown>,
    state: Record<string, unknown>,
    reactElement?: HTMLElement
) {
    const api = window.__wdioReact
    const fiber = api && api.findFiber(reactElement)
    if (!api || !fiber) {
        throw new Error(reactElement
            ? 'Could not find instance of React in given element'
            : 'Could not find the root element of your application'
        )
    }

    /**
     * A fragment has more than one DOM node: the driver does not understand nested
     * arrays, so [[div, div], [div, div]] => [div, div, div, div]. A node comes back
     * once: a higher-order component and its child have the same node, and the
     * browsers do not all send a node twice in the same result.
     */
    const nodes: (HTMLElement | Text)[] = []
    for (const element of api.query(selector, props || {}, state || {}, fiber)) {
        for (const node of [element.node].flat()) {
            if (node && !nodes.includes(node)) {
                nodes.push(node)
            }
        }
    }
    return nodes
}
