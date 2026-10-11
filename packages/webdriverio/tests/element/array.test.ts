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

    it('refetches an out-of-range index after the list has resolved', async () => {
        const late = element('late')
        const parent = {
            options: { waitforTimeout: 50 },
            $$: vi.fn(),
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

        await elements
        expect(elements).toHaveLength(1)
        expect(elements[0].elementId).toBe('a')
        expect(elements.at(0).elementId).toBe('a')
        expect(parent.waitUntil).not.toHaveBeenCalled()

        await expect(elements[1].elementId).resolves.toBe('late')
        await expect(elements.at(1).elementId).resolves.toBe('late')
        expect(parent.waitUntil).toHaveBeenCalledTimes(2)

        const sliced = elements.slice(0, 1)
        expect(sliced[3]).toBeUndefined()
        expect(sliced.at(3)).toBeUndefined()
        expect(parent.waitUntil).toHaveBeenCalledTimes(2)
    })

    it('does not refetch an index outside a filtered list', async () => {
        const parent = {
            options: { waitforTimeout: 50 },
            $$: vi.fn(),
            waitUntil: vi.fn(async () => {
                throw new Error('filter must not refetch the original query')
            })
        }
        parent.$$.mockResolvedValue(ElementArray.fromResolved([
            element('a'),
            element('b'),
            element('c')
        ], {
            selector: '.item',
            foundWith: '$$',
            parent: parent as unknown as WebdriverIO.Browser,
            props: []
        }))

        const elements = ElementArray.fromAsyncCallback(async () => [
            element('a'),
            element('b'),
            element('c')
        ], {
            selector: '.item',
            foundWith: '$$',
            parent: parent as unknown as WebdriverIO.Browser,
            props: []
        })

        const filtered = await elements.filter(async (el) => el.elementId === 'a')
        const filteredSeries = await elements.filterSeries(async (el) => el.elementId === 'a')
        expect(filtered).toHaveLength(1)
        expect(filtered[1]).toBeUndefined()
        expect(filtered.at(1)).toBeUndefined()
        expect(filteredSeries[1]).toBeUndefined()
        expect(parent.waitUntil).not.toHaveBeenCalled()
        expect(parent.$$).not.toHaveBeenCalled()
    })

    it('normalizes at() the same way a plain array does', () => {
        const parent = {
            options: { waitforTimeout: 50 },
            $$: vi.fn(),
            waitUntil: vi.fn()
        }
        const elements = ElementArray.fromResolved([
            element('a'),
            element('b'),
            element('c')
        ], {
            selector: '.item',
            foundWith: '$$',
            parent: parent as unknown as WebdriverIO.Browser,
            props: []
        })

        expect(elements.at(1.5).elementId).toBe('b')
        expect(elements.at(Number.NaN).elementId).toBe('a')
        expect(elements.at(-1.2).elementId).toBe('c')
        expect(elements.at(Number.POSITIVE_INFINITY)).toBeUndefined()
        expect(parent.waitUntil).not.toHaveBeenCalled()
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

    describe('index past the end', () => {
        /**
         * A `waitUntil` that runs the condition once and, like the real command,
         * rejects with `timeoutMsg` when it gives no element.
         */
        const waitOnce = () => vi.fn(async (condition: () => Promise<WebdriverIO.Element | false>, options: { timeoutMsg: string }) => {
            const match = await condition()
            if (!match) {
                throw new Error(options.timeoutMsg)
            }
            return match
        })

        it('rejects with the browser timeout and an out of bounds message', async () => {
            const browser = {
                options: { waitforTimeout: 50 },
                $$: vi.fn(async () => ElementArray.fromResolved([element('a')], { selector: '.item', foundWith: '$$', props: [] })),
                waitUntil: waitOnce()
            }
            const elements = await ElementArray.fromAsyncCallback(async () => [element('a')], {
                selector: '.item',
                foundWith: '$$',
                parent: browser as unknown as WebdriverIO.Browser,
                props: []
            })

            await expect(elements[1].getText()).rejects.toThrow('Index out of bounds! $$(.item) returned only 1 elements.')
            expect(browser.waitUntil).toHaveBeenCalledWith(expect.any(Function), {
                timeout: 50,
                timeoutMsg: 'Index out of bounds! $$(.item) returned only 1 elements.'
            })
        })

        it('waits with the browser and queries the parent element of the list', async () => {
            const late = element('late')
            const browser = { options: { waitforTimeout: 50 }, waitUntil: waitOnce() }
            const parent = {
                parent: browser,
                $$: vi.fn(async () => ElementArray.fromResolved([element('a'), late], { selector: '.item', foundWith: '$$', props: [] }))
            }
            const elements = await ElementArray.fromAsyncCallback(async () => [element('a')], {
                selector: '.item',
                foundWith: '$$',
                parent: parent as unknown as WebdriverIO.Element,
                props: []
            })

            await expect(elements[1].elementId).resolves.toBe('late')
            expect(browser.waitUntil).toHaveBeenCalledOnce()
            expect(parent.$$).toHaveBeenCalledWith('.item')
        })

        it('does not wait when the list has no parent', async () => {
            const elements = ElementArray.fromResolved([element('a')], {
                selector: '.item',
                foundWith: '$$',
                props: []
            })

            await expect(elements[1].getText()).rejects.toThrow(/could not be found/)
        })

        it('does not find an element when the parent has no query of that name', async () => {
            const browser = { options: { waitforTimeout: 50 }, waitUntil: waitOnce() }
            const elements = await ElementArray.fromAsyncCallback(async () => [element('a')], {
                selector: 'one',
                foundWith: 'custom$$',
                parent: browser as unknown as WebdriverIO.Browser,
                props: []
            })

            await expect(elements[1].getText()).rejects.toThrow('Index out of bounds! $$(one) returned only 1 elements.')
            expect(browser.waitUntil).toHaveBeenCalledOnce()
        })
    })

    it('gives an index of a pending list that is in range without a wait', async () => {
        const browser = { options: { waitforTimeout: 50 }, $$: vi.fn(), waitUntil: vi.fn() }
        const elements = ElementArray.fromAsyncCallback(async () => [element('a'), element('b')], {
            selector: '.item',
            foundWith: '$$',
            parent: browser as unknown as WebdriverIO.Browser,
            props: []
        })

        await expect(elements[1].elementId).resolves.toBe('b')
        expect(browser.waitUntil).not.toHaveBeenCalled()
        expect(browser.$$).not.toHaveBeenCalled()
    })

    it('reads a negative at() of a pending list from the end, without a wait', async () => {
        const browser = { options: { waitforTimeout: 50 }, $$: vi.fn(), waitUntil: vi.fn() }
        const elements = ElementArray.fromAsyncCallback(async () => [element('a'), element('b'), element('c')], {
            selector: '.item',
            foundWith: '$$',
            parent: browser as unknown as WebdriverIO.Browser,
            props: []
        })

        await expect(elements.at(-1).elementId).resolves.toBe('c')
        expect(browser.waitUntil).not.toHaveBeenCalled()
        expect(browser.$$).not.toHaveBeenCalled()
    })

    /**
     * the browser bundle supports Chrome 90 and Safari 14.1, which have no
     * `Array.prototype.at` (ES2022)
     */
    it('reads at() in a browser without Array.prototype.at', async () => {
        const parent = { options: { waitforTimeout: 50 }, $$: vi.fn(), waitUntil: vi.fn() }
        const options = () => ({ selector: '.item', foundWith: '$$' as const, parent: parent as unknown as WebdriverIO.Browser, props: [] })
        const resolved = ElementArray.fromResolved([element('a'), element('b'), element('c')], options())
        const pending = ElementArray.fromAsyncCallback(async () => [element('a'), element('b'), element('c')], options())

        const arrayAt = Object.getOwnPropertyDescriptor(Array.prototype, 'at')!
        delete (Array.prototype as { at?: unknown }).at
        try {
            expect(resolved.at(-1.2).elementId).toBe('c')
            expect(resolved.at(-4)).toBeUndefined()
            expect(resolved.at(Number.NEGATIVE_INFINITY)).toBeUndefined()
            expect(resolved.at(Number.POSITIVE_INFINITY)).toBeUndefined()
            await expect(pending.at(-1).elementId).resolves.toBe('c')
            // resolved now: at() returns the element itself
            expect(pending.at(-3).elementId).toBe('a')
        } finally {
            Object.defineProperty(Array.prototype, 'at', arrayAt)
        }
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
