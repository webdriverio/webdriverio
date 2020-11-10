import type { ElementHandle } from 'puppeteer-core/lib/cjs/puppeteer/common/JSHandle'

export default class ElementStore {
    index = 0
    elementMap: Map<string, ElementHandle> = new Map()

    constructor () {
        this.index = 0
        this.elementMap = new Map()
    }

    set (elementHandle: ElementHandle) {
        const index = `ELEMENT-${++this.index}`
        this.elementMap.set(index, elementHandle)
        return index
    }

    async get (index: string) {
        const elementHandle = this.elementMap.get(index)

        if (!elementHandle) {
            return elementHandle
        }

        const isElementAttachedToDOM = await elementHandle.evaluate((el: any) => {
            // https://developer.mozilla.org/en-US/docs/Web/API/Node/isConnected
            return el.isConnected
        })

        return isElementAttachedToDOM ? elementHandle : undefined
    }

    clear () {
        this.elementMap.clear()
    }
}
