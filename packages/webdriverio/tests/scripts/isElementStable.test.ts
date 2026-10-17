/**
 * @vitest-environment jsdom
 */
import { it, expect, describe, vi, afterEach } from 'vitest'
import isElementStable from '../../src/scripts/isElementStable.js'

const STALE = 'stale element reference: element is not attached to the page document'

describe('isElementStable script', () => {
    it('throws the stale element error for an element that the page removed', async () => {
        await expect(isElementStable(document.createElement('div'))).rejects.toThrow(STALE)
    })

    it('throws the stale element error for an element of another document', async () => {
        const oldDocument = document.implementation.createHTMLDocument('old page')
        const elem = oldDocument.createElement('div')
        oldDocument.body.appendChild(elem)
        await expect(isElementStable(elem)).rejects.toThrow(STALE)
    })

    describe('when animation frames are late', () => {
        afterEach(() => {
            vi.useRealTimers()
            vi.unstubAllGlobals()
            document.body.replaceChildren()
        })

        it('still sees an element that moves before the frames come', async () => {
            vi.useFakeTimers()
            const frames: (() => void)[] = []
            vi.stubGlobal('requestAnimationFrame', (callback: () => void) => frames.push(callback))
            const elem = document.createElement('div')
            document.body.appendChild(elem)
            const start = Date.now()
            // the page renders no frame for 300 ms (busy runner), but the animation moves the element
            elem.getBoundingClientRect = () => ({ x: Date.now() - start >= 300 ? 10 : 0, y: 0, width: 1, height: 1 }) as DOMRect

            const result = isElementStable(elem)
            await vi.advanceTimersByTimeAsync(300)
            frames.splice(0).forEach((frame) => frame())
            frames.splice(0).forEach((frame) => frame())
            await vi.advanceTimersByTimeAsync(1000)
            expect(await result).toBe(false)
        })
    })
})
