import type { ElementHandle } from 'puppeteer-core/lib/cjs/puppeteer/common/JSHandle'

export default class ElementStore {
    private _index = 0
    private _elementMap: Map<string, ElementHandle> = new Map()

    set (elementHandle: ElementHandle) {
        const index = `ELEMENT-${++this._index}`
        this._elementMap.set(index, elementHandle)
        return index
    }

    async get (index: string) {
        const elementHandle = this._elementMap.get(index)

        if (!elementHandle) {
            return elementHandle
        }

        const isElementAttachedToDOM = await elementHandle.evaluate((el: HTMLElement) => {
            // https://developer.mozilla.org/en-US/docs/Web/API/Node/isConnected
            return el.isConnected
        })

        return isElementAttachedToDOM ? elementHandle : undefined
    }

    clear () {
        this._elementMap.clear()
    }
}
