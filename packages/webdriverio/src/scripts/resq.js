export const waitToLoadReact = function waitToLoadReact () {
    window.resq.waitToLoadReact()
}

export const react$ = function react$ (selector, props, state) {
    let elem = window.resq.resq$(selector)
        .byProps(props)
        .byState(state)

    if (!elem.name) {
        return { message: `React element with selector "${selector}" wasn't found` }
    }

    return elem.node || elem.children[0].node
}

export const react$$ = function react$$ (selector, props, state) {
    let elems = window.resq.resq$$(selector)
        .byProps(props)
        .byState(state)

    if (!elems.length) {
        return { message: `React elements with selector "${selector}" wasn't found` }
    }

    return [...elems].map(elem => elem.node || elem.children[0].node)
}
