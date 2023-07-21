export default function collectMetaElements () {
    const selector = 'head meta'
    const realMatchesFn = window.Element.prototype.matches
    const metas: Element[] = []

    const _findAllElements = (nodes: NodeListOf<Element>) => {
        // eslint-disable-next-line no-cond-assign
        for (let i = 0, el; el = nodes[i]; ++i) {
            if (!selector || realMatchesFn.call(el, selector)) {
                metas.push(el)
            }
            // If the element has a shadow root, dig deeper.
            if (el.shadowRoot) {
                _findAllElements(el.shadowRoot.querySelectorAll('*'))
            }
        }
    }
    _findAllElements(document.querySelectorAll('*'))

    return metas.map(meta => {
        const getAttribute = (name: string) => {
            const attr = meta.attributes.getNamedItem(name)
            if (!attr) {
                return
            }
            return attr.value
        }

        return {
            // @ts-ignore
            name: meta.name.toLowerCase(),
            // @ts-ignore
            content: meta.content,
            property: getAttribute('property'),
            // @ts-ignore
            httpEquiv: meta.httpEquiv ? meta.httpEquiv.toLowerCase() : undefined,
            charset: getAttribute('charset'),
        }
    })
}
