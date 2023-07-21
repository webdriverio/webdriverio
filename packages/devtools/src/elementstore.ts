import type { ElementHandle } from 'puppeteer-core/lib/esm/puppeteer/api/ElementHandle.js'
import type { Frame } from 'puppeteer-core/lib/esm/puppeteer/common/Frame.js'

export default class ElementStore {
    private _index = 0
    private _elementMap: Map<string, ElementHandle> = new Map()
    private _frameMap: Map<Frame, Set<string>> = new Map()

    set (elementHandle: ElementHandle) {
        const index = `ELEMENT-${++this._index}`
        this._elementMap.set(index, elementHandle)
        const frame = elementHandle.executionContext()._world?.frame()
        if (frame) {
            let elementIndexes = this._frameMap.get(frame)
            if (!elementIndexes) {
                elementIndexes = new Set()
                this._frameMap.set(frame, elementIndexes)
            }
            elementIndexes.add(index)
        }
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

    clear (frame?: Frame) {
        if (!frame) {
            this._elementMap.clear()
            this._frameMap.clear()
            return
        }

        const elementIndexes = this._frameMap.get(frame)
        if (elementIndexes) {
            elementIndexes.forEach((elementIndex) => this._elementMap.delete(elementIndex))
            this._frameMap.delete(frame)
        }
    }
}
