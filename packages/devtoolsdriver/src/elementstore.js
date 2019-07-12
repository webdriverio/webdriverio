export default class ElementStore {
    constructor () {
        this.index = 0
        this.elementMap = new Map()
    }

    set (nodeId) {
        const index = `ELEMENT-${++this.index}`
        this.elementMap.set(index, nodeId)
        return index
    }

    get (index) {
        return this.elementMap.get(index)
    }
}
