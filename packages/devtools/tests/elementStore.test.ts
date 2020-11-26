import ElementStore from '../src/elementstore'
import type { ElementHandle } from 'puppeteer-core/lib/cjs/puppeteer/common/JSHandle'

const elementHandleFactory = (
    { isConnected = true }: { isConnected?: boolean } = {}
) => ({
    id: Math.random(),
    async evaluate(cb: any) {
        return cb({ isConnected })
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
