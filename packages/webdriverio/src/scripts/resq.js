export const waitToLoadReact = function waitToLoadReact () {
    window.resq.waitToLoadReact()
}

export const react$ = function react$ (selector, props, state) {
    const elems = window.resq.resq$$(selector)
        .byProps(props)
        .byState(state)

    if (elems.length === 0) {
        return { message: `React element with selector "${selector}" wasn't found` }
    }

    let elem = elems[0]

    if (elem.node) {
        return elem.node
    }

    elem = elem.node || elem.children[0].node
    return elem
}

export const react$$ = function react$$ (selector, props, state) {
    const elems = window.resq.resq$$(selector)
        .byProps(props)
        .byState(state)

    return [...elems].map((elem) => {
        if (elem.node) {
            return elem.node
        }

        elem = elem.node || elem.children[0].node
        return elem
    })
}
