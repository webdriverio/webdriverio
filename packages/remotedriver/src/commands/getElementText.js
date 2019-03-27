import { JSDOM } from 'jsdom'

export default async function getElementText (connection, { elementId }) {
    const { DOM } = connection
    const nodeId = this.elementStore.get(elementId)

    if (typeof nodeId === 'undefined') {
        throw new Error(`element with id '${elementId}' not found`)
    }

    const { outerHTML } = await DOM.getOuterHTML({ nodeId })
    const dom = new JSDOM(outerHTML)
    return dom.window.document.body.children[0].textContent
}
