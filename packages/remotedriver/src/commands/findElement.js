import { ELEMENT_KEY } from '../constants'

export default async function findElement (connection, { using, value }) {
    const { DOM } = connection

    /**
     * get document if not fetched yet
     */
    if (!this.root) {
        const { root } = await DOM.getDocument({ depth: -1 })
        this.root = root
    }

    if (using !== 'css selector') {
        throw new Error(`selector strategy '${using}' not yet supported`)
    }

    const { nodeId } = await DOM.querySelector({ selector: value, nodeId: this.root.nodeId })
    return { [ELEMENT_KEY]: this.elementStore.set(nodeId) }
}
