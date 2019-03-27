export default async function getElementText (connection, { elementId }) {
    const { DOM, Input } = connection
    const nodeId = this.elementStore.get(elementId)

    if (typeof nodeId === 'undefined') {
        throw new Error(`element with id '${elementId}' not found`)
    }

    /**
     * get box model for width and height
     */
    const { model } = await DOM.getBoxModel({ nodeId })
    const left = model.content[0]
    const top = model.content[1]
    const right = model.content[2]
    const bottom = model.content[5]
    const x = (right + left) / 2
    const y = (bottom + top) / 2

    /**
     * mouse move
     */
    await Input.dispatchMouseEvent({
        type: 'mouseMoved',
        button: 'none',
        clickCount: 0,
        modifiers: 0,
        x,
        y
    })

    /**
     * mouse move
     */
    await Input.dispatchMouseEvent({
        type: 'mousePressed',
        button: 'left',
        clickCount: 1,
        modifiers: 0,
        x,
        y
    })

    /**
     * mouse move
     */
    await Input.dispatchMouseEvent({
        type: 'mouseReleased',
        button: 'left',
        clickCount: 1,
        modifiers: 0,
        x,
        y
    })

    return
}
