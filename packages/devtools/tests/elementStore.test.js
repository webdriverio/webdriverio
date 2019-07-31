import ElementStore from '../src/elementstore'

test('should keep a map of elements', () => {
    const store = new ElementStore()
    store.set('foobar')
    expect(store.get('ELEMENT-1')).toBe('foobar')

    store.clear()
    expect(store.elementMap.size).toBe(0)

    store.set('barfoo')
    expect(store.get('ELEMENT-2')).toBe('barfoo')
})
