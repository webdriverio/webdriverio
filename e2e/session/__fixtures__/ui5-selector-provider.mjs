// The functions are serialized with toString() and run in the page, so they must not close over anything, which is why the getter/filter logic is duplicated inside each.
export default {
    name: 'ui5',
    candidates: (el) => {
        const E = window.sap?.ui?.core?.Element
        if (!E) {
            return undefined
        }
        const c = E.closestTo(el)
        if (!c || (c.getDomRef() !== el && c.getFocusDomRef?.() !== el)) {
            return undefined
        }
        const id = c.getId()
        if (!id.startsWith('__')) {
            return 'ui5:' + JSON.stringify({ id })
        }
        const type = c.getMetadata().getName()
        for (const prop of ['text', 'title', 'tooltip', 'placeholder']) {
            const getter = `get${prop[0].toUpperCase()}${prop.slice(1)}`
            const value = typeof c[getter] === 'function' ? c[getter]() : undefined
            if (typeof value !== 'string' || !value) {
                continue
            }
            const matches = E.registry.filter((x) => x.getMetadata().getName() === type && typeof x[getter] === 'function' && x[getter]() === value)
            if (matches.length !== 1) {
                continue
            }
            return 'ui5:' + JSON.stringify({ controlType: type, properties: { [prop]: value } })
        }
        return undefined
    },
    locator: (arg) => {
        const E = window.sap.ui.core.Element
        const { id, controlType, properties = {} } = JSON.parse(arg)
        const controls = id
            ? [E.getElementById(id)]
            : E.registry.filter((x) => x.getMetadata().getName() === controlType && Object.entries(properties).every(([prop, value]) => {
                const getter = `get${prop[0].toUpperCase()}${prop.slice(1)}`
                return typeof x[getter] === 'function' && x[getter]() === value
            }))
        return controls.map((c) => c?.getFocusDomRef?.() || c?.getDomRef?.()).filter(Boolean)
    }
}
