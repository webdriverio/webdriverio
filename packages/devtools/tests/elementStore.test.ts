import path from 'node:path'
import { expect, test, vi } from 'vitest'
import ElementStore from '../src/elementstore.js'
import type { ElementHandle } from 'puppeteer-core/lib/esm/puppeteer/common/ElementHandle.js'
import type { Frame } from 'puppeteer-core/lib/esm/puppeteer/common/Frame.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const elementHandleFactory = (
    { isConnected = true, frame = Symbol() }: { isConnected?: boolean, frame?: symbol } = {}
) => ({
    id: Math.random(),
    async evaluate(cb: any) {
        return cb({ isConnected })
    },
    executionContext() {
        return { _world: { frame: () => frame } }
    }
})

test('should keep a map of elements', async () => {
    const store = new ElementStore()
    const elementHandle1 = elementHandleFactory() as any as ElementHandle
    store.set(elementHandle1)
    expect(await store.get('ELEMENT-1')).toBe(elementHandle1)

    store.clear()
    expect(store['_elementMap'].size).toBe(0)

    const elementHandle2 = elementHandleFactory() as any as ElementHandle
    store.set(elementHandle2)
    expect(await store.get('ELEMENT-2')).toBe(elementHandle2)
    expect(await store.get('ELEMENT-3')).toBe(undefined)
})

test('should not return element if it is not attached to the DOM', async () => {
    const store = new ElementStore()
    const elementHandle = elementHandleFactory({ isConnected: false }) as any as ElementHandle
    store.set(elementHandle)
    expect(await store.get('ELEMENT-1')).toBe(undefined)
})

test('should clear elements of a specific frame', async () => {
    const store = new ElementStore()
    const frame1 = Symbol('frame1')
    const frame2 = Symbol('frame2')
    const elementHandle1 = elementHandleFactory({ frame: frame1 }) as any as ElementHandle
    store.set(elementHandle1)
    const elementHandle2 = elementHandleFactory({ frame: frame2 }) as any as ElementHandle
    store.set(elementHandle2)
    expect(store['_frameMap'].size).toBe(2)

    store.clear(frame1 as any as Frame)

    expect(await store.get('ELEMENT-1')).toBe(undefined)
    expect(await store.get('ELEMENT-2')).toBe(elementHandle2)
})
