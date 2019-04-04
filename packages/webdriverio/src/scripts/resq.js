export const waitToLoadReact = function waitToLoadReact () {
    window.resq.waitToLoadReact()
}

export const react$ = function react$ (selector, props, state) {
    let element = window.resq.resq$(selector)
        .byProps(props)
        .byState(state)

    if (!element.name) {
        return { message: `React element with selector "${selector}" wasn't found` }
    }

    return element.node || element.children[0].node
}

export const react$$ = function react$$ (selector, props, state) {
    let elements = window.resq.resq$$(selector)
        .byProps(props)
        .byState(state)

    if (!elements.length) {
        return { message: `React elements with selector "${selector}" wasn't found` }
    }

    return [...elements].map(element => element.node || element.children[0].node)
}
