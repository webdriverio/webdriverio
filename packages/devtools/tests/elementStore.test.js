import ElementStore from '../src/elementstore'

const elementHandleFactory = ({ isConnected = true } = {}) => ({
    id: Math.random(),
    async evaluate(cb) {
        return cb({ isConnected })
    }
})

test('should keep a map of elements', async () => {
    const store = new ElementStore()
    const elementHandle1 = elementHandleFactory()
    store.set(elementHandle1)
    expect(await store.get('ELEMENT-1')).toBe(elementHandle1)

    store.clear()
    expect(store.elementMap.size).toBe(0)

    const elementHandle2 = elementHandleFactory()
    store.set(elementHandle2)
    expect(await store.get('ELEMENT-2')).toBe(elementHandle2)
})

test('should not return element if it is not attached to the DOM', async () => {
    const store = new ElementStore()
    const elementHandle = elementHandleFactory({ isConnected: false })
    store.set(elementHandle)
    expect(await store.get('ELEMENT-3')).toBe(undefined)
})
