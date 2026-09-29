import { expect, describe, it, vi } from 'vitest'

import { ElementArray } from '../../src/element/array.js'

const element = (id: string) => ({
    elementId: id,
    selector: '.item',
    getText: vi.fn(async () => id)
}) as unknown as WebdriverIO.Element

describe('ElementArray', () => {
    it('resolves a lazy list once and then stops being thenable', async () => {
        let fetches = 0
        const elements = ElementArray.fromAsyncCallback(async () => {
            fetches++
            return [element('a'), element('b')]
        }, {
            selector: '.item',
            foundWith: '$$',
            props: []
        })

        expect(Array.isArray(elements)).toBe(true)
        expect(fetches).toBe(0)

        const resolved = await elements
        expect(resolved).toBe(elements)
        expect(fetches).toBe(1)
        expect(elements).toHaveLength(2)
        expect(elements.then).toBeUndefined()
        expect(await elements).toBe(elements)
        expect(fetches).toBe(1)
        expect(elements.selector).toBe('.item')
        expect(elements.foundWith).toBe('$$')
        expect(await elements.getElements()).toBe(elements)
        expect('selector' in elements).toBe(true)
        expect('foundWith' in elements).toBe(true)
        expect('parent' in elements).toBe(true)
        expect('getElements' in elements).toBe(true)
        expect('props' in elements).toBe(true)
    })

    it('supports for-await, async helpers and a resolved sync iterator', async () => {
        const elements = ElementArray.fromAsyncCallback(async () => [
            element('a'),
            element('b'),
            element('c')
        ], {
            selector: '.item',
            foundWith: '$$',
            props: ['extra']
        })

        const iterated: string[] = []
        for await (const el of elements) {
            iterated.push(el.elementId)
        }
        expect(iterated).toEqual(['a', 'b', 'c'])

        await expect(elements.map((el) => el.getText())).resolves.toEqual(['a', 'b', 'c'])
        await expect(elements.mapSeries(async (el) => el.elementId)).resolves.toEqual(['a', 'b', 'c'])

        const found = await elements.findSeries(async (el) => el.elementId === 'b')
        expect(found?.elementId).toBe('b')
        await expect(elements.some(async (el) => el.elementId === 'c')).resolves.toBe(true)
        await expect(elements.every(async (el) => el.elementId !== 'missing')).resolves.toBe(true)

        const filtered = await elements.filterSeries(async (el) => el.elementId !== 'b')
        expect(await filtered.map((el) => el.elementId)).toEqual(['a', 'c'])
        expect(filtered.selector).toBe('.item')
        expect(filtered.props).toEqual(['extra'])

        const sliced = elements.slice(1, 3)
        expect(sliced.foundWith).toBe('$$')
        await expect(sliced.map((el) => el.elementId)).resolves.toEqual(['b', 'c'])

        expect([...elements].map((el) => el.elementId)).toEqual(['a', 'b', 'c'])

        const pairs: Array<[number, string]> = []
        for await (const [index, el] of elements.entries()) {
            pairs.push([index, el.elementId])
        }
        expect(pairs).toEqual([[0, 'a'], [1, 'b'], [2, 'c']])
    })

    it('refetches an index that is outside the current list', async () => {
        const late = element('late')
        const parent = {
            options: { waitforTimeout: 50 },
            $$: vi.fn(async () => ElementArray.fromResolved([element('a'), late], {
                selector: '.item',
                foundWith: '$$',
                parent: undefined,
                props: []
            })),
            waitUntil: vi.fn(async (condition: () => Promise<WebdriverIO.Element | false>) => {
                const match = await condition()
                if (!match) {
                    throw new Error('timed out')
                }
                return match
            })
        }
        parent.$$.mockResolvedValue(ElementArray.fromResolved([element('a'), late], {
            selector: '.item',
            foundWith: '$$',
            parent: parent as unknown as WebdriverIO.Browser,
            props: []
        }))

        const elements = ElementArray.fromAsyncCallback(async () => [element('a')], {
            selector: '.item',
            foundWith: '$$',
            parent: parent as unknown as WebdriverIO.Browser,
            props: []
        })

        await expect(elements[1].elementId).resolves.toBe('late')
        expect(parent.waitUntil).toHaveBeenCalledOnce()
    })

    it('does not refetch an index outside a pending slice', async () => {
        const parent = {
            options: { waitforTimeout: 50 },
            $$: vi.fn(),
            waitUntil: vi.fn(async () => {
                throw new Error('slice must not refetch the original query')
            })
        }
        const elements = ElementArray.fromAsyncCallback(async () => [
            element('a'),
            element('b'),
            element('c'),
            element('d')
        ], {
            selector: '.item',
            foundWith: '$$',
            parent: parent as unknown as WebdriverIO.Browser,
            props: []
        })

        const sliced = elements.slice(0, 2)
        await expect(sliced[3].getText()).rejects.toThrow(/could not be found/)
        expect(parent.waitUntil).not.toHaveBeenCalled()
        expect(parent.$$).not.toHaveBeenCalled()
        expect(await sliced.map((el) => el.elementId)).toEqual(['a', 'b'])
    })

    it('gives a resolved list from plain elements the same metadata', () => {
        const elements = ElementArray.fromResolved([element('a')], {
            selector: '.ready',
            foundWith: 'custom$$',
            props: [1],
            isMultiRemote: true
        })

        expect(elements).toHaveLength(1)
        expect(elements[0].elementId).toBe('a')
        expect(elements.foundWith).toBe('custom$$')
        expect(elements.isMultiRemote).toBe(true)
        expect(elements.then).toBeUndefined()
    })
})
