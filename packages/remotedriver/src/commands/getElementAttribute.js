export default async function getElementText (connection, { elementId, name }) {
    const { DOM } = connection
    const nodeId = this.elementStore.get(elementId)

    if (typeof nodeId === 'undefined') {
        throw new Error(`element with id '${elementId}' not found`)
    }

    /**
     * get box model for width and height
     */
    const { attributes } = await DOM.getAttributes({ nodeId })
    const index = attributes.indexOf(name)

    if (index === -1) {
        throw new Error(`Property ${name} not found`)
    }

    return attributes.splice(index)[1]
}
