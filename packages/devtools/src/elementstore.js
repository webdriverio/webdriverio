export default class ElementStore {
    constructor () {
        this.index = 0
        this.elementMap = new Map()
    }

    set (elementHandle) {
        const index = `ELEMENT-${++this.index}`
        this.elementMap.set(index, elementHandle)
        return index
    }

    async get (index) {
        const elementHandle = this.elementMap.get(index)

        if (!elementHandle) {
            return elementHandle
        }

        const isElementAttachedToDOM = await elementHandle.evaluate(el => {
            // https://developer.mozilla.org/en-US/docs/Web/API/Node/isConnected
            return el.isConnected
        })

        return isElementAttachedToDOM ? elementHandle : undefined
    }

    clear () {
        this.elementMap.clear()
    }
}
