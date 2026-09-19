import { describe, it, expect } from 'vitest'
import { SERIALIZER_HELPER } from '../../../src/utils/bidi/serialize.js'

describe('Bidi Serialization Circular References', () => {
    it('should return [Circular] for circular references', async () => {
        // Evaluate the serializer code in a "browser-like" context (Node.js vm or just new Function)
        // Since SERIALIZER_HELPER contains __wdioSerializeValue, we can construct a function to use it.
        const serializerFunction = new Function(`
            ${SERIALIZER_HELPER}
            return __wdioSerializeValue(arguments[0]);
        `)

        const obj: any = { foo: 'bar' }
        obj.self = obj

        const serialized = await serializerFunction(obj)
        expect(serialized).toEqual({
            foo: 'bar',
            self: '[Circular]'
        })
    })

    it('should handle nested circular references', async () => {
        const serializerFunction = new Function(`
            ${SERIALIZER_HELPER}
            return __wdioSerializeValue(arguments[0]);
        `)

        const a: any = { name: 'a' }
        const b: any = { name: 'b' }
        a.child = b
        b.parent = a

        const serialized = await serializerFunction(a)
        expect(serialized).toEqual({
            name: 'a',
            child: {
                name: 'b',
                parent: '[Circular]'
            }
        })
    })

    it('should handle arrays with circular references', async () => {
        const serializerFunction = new Function(`
            ${SERIALIZER_HELPER}
            return __wdioSerializeValue(arguments[0]);
        `)

        const arr: any[] = []
        arr.push(arr)

        const serialized = await serializerFunction(arr)
        expect(serialized).toEqual(['[Circular]'])
    })
})
