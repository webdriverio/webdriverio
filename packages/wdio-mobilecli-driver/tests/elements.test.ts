import { describe, it, expect, beforeEach } from 'vitest'

import { ElementRegistry } from '../src/elements.js'
import { IOS_TREE } from './__fixtures__/trees.js'

describe('ElementRegistry', () => {
    let registry: ElementRegistry

    beforeEach(() => {
        registry = new ElementRegistry()
    })

    it('gives the same element the same id', () => {
        const id = registry.register({ using: 'class name', value: 'Button', index: 0 })

        expect(id).toMatch(/^[0-9a-f-]{36}$/)
        expect(registry.register({ using: 'class name', value: 'Button', index: 0 })).toBe(id)
        expect(registry.register({ using: 'class name', value: 'Button', index: 1 })).not.toBe(id)
        expect(registry.register({ using: 'id', value: 'Button', index: 0 })).not.toBe(id)
    })

    it('finds a registered element in a dump', () => {
        const first = registry.register({ using: 'class name', value: 'Button', index: 0 })
        const second = registry.register({ using: 'class name', value: 'Button', index: 1 })

        expect(registry.resolve(first, IOS_TREE, 'ios').ref).toBe('@e4')
        expect(registry.resolve(second, IOS_TREE, 'ios').ref).toBe('@e7')
    })

    it('throws a stale element error if the element is gone', () => {
        const id = registry.register({ using: 'class name', value: 'Button', index: 1 })
        const error = (() => {
            try {
                return registry.resolve(id, [IOS_TREE[0]], 'ios')
            } catch (err) {
                return err as Error
            }
        })() as Error

        expect(error.name).toBe('stale element reference')
        expect(error.message).toBe('The element with the selector "Button" (class name) is not on the screen anymore')
    })

    it('throws a no such element error for an id it did not give out', () => {
        expect(() => registry.resolve('nope', IOS_TREE, 'ios')).toThrow(expect.objectContaining({
            name: 'no such element',
            message: 'The element with the id "nope" is not known in this session'
        }))
    })

    it('forgets the elements when it is cleared', () => {
        const id = registry.register({ using: 'class name', value: 'Button', index: 0 })
        registry.clear()

        expect(() => registry.resolve(id, IOS_TREE, 'ios')).toThrow(expect.objectContaining({ name: 'no such element' }))
        expect(registry.register({ using: 'class name', value: 'Button', index: 0 })).not.toBe(id)
    })
})
