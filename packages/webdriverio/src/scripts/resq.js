export const waitToLoadReact = function waitToLoadReact () {
    window.resq.waitToLoadReact()
}

export const react$ = function react$ (selector, props, state, reactElement) {
    props = props || {}
    state = state || {}

    let element = window.resq.resq$(selector, reactElement)

    if (Object.keys(props).length) {
        element = element.byProps(props)
    }

    if (Object.keys(state).length) {
        element = element.byState(state)
    }

    if (!element.name) {
        return { message: `React element with selector "${selector}" wasn't found` }
    }

    // resq returns an array of HTMLElements if the React component is a fragment
    // if the element is a fragment, we return the first child to be passed into the driver
    return element.isFragment ? element.node[0] : element.node
}

export const react$$ = function react$$ (selector, props, state, reactElement) {
    let elements = window.resq.resq$$(selector, reactElement)

    if (Object.keys(props).length) {
        elements = elements.byProps(props)
    }

    if (Object.keys(state).length) {
        elements = elements.byState(state)
    }

    if (!elements.length) {
        return []
    }

    // resq returns an array of HTMLElements if the React component is a fragment
    // this avoids having nested arrays of nodes which the driver does not understand
    // [[div, div], [div, div]] => [div, div, div, div]
    let nodes = []

    elements.forEach(element => {
        const { node, isFragment } = element

        if (isFragment) {
            nodes = nodes.concat(node)
        } else {
            nodes.push(node)
        }
    })

    return [...nodes]
}
