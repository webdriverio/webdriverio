export const waitToLoadReact = function waitToLoadReact () {
    window.resq.waitToLoadReact()
}

export const react$ = function react$ (selector, props) {
    const elems = window.resq.resq$$(selector)

    if (Object.keys(props).length === 0) {
        return elems[0]
    }

    let elem = [...elems].find((elem) => {
        for (const [name, value] of Object.entries(props)) {
            // logs.push(`check ${name} and ${value} for ${elem[name]}`)
            if (elem.props[name] === value) {
                return true
            }
        }

        return false
    })

    if (!elem || (!elem.node && elem.children.length === 0)) {
        return
    }

    if (elem.node) {
        return elem.node
    }

    elem = elem.node || elem.children[0].node

    if (!elem) {
        throw new Error('NotFound')
    }

    return elem
}
