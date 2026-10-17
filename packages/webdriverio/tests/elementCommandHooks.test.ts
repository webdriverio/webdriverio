import path from 'node:path'

import { describe, it, expect, vi } from 'vitest'
import { remote } from '../src/index.js'
import { waitForExist } from '../src/commands/element/waitForExist.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../src/commands/element/waitForExist.js', async (importOriginal) => {
    const original = await importOriginal<Record<string, (...args: unknown[]) => unknown>>()
    return { ...original, waitForExist: vi.fn(original.waitForExist) }
})

describe('element protocol command hooks', () => {
    it('fires as many afterCommand as beforeCommand hooks for one command', async () => {
        const beforeCommand = vi.fn()
        const afterCommand = vi.fn()
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: { browserName: 'foobar' },
            beforeCommand: [beforeCommand],
            afterCommand: [afterCommand]
        })
        const elem = await browser.$('.foo')
        beforeCommand.mockClear()
        afterCommand.mockClear()

        await elem.elementClick(elem.elementId)

        expect(beforeCommand).toHaveBeenCalled()
        expect(afterCommand.mock.calls.length).toBe(beforeCommand.mock.calls.length)
    })

    const session = async () => {
        const before: [string, unknown[]][] = []
        const after: [string, unknown[]][] = []
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: { browserName: 'foobar' },
            beforeCommand: [(name: string, args: unknown[]) => { before.push([name, args]) }],
            afterCommand: [(name: string, args: unknown[]) => { after.push([name, args]) }]
        })
        return { browser, before, after, reset: () => { before.length = 0; after.length = 0 } }
    }
    const names = (calls: [string, unknown[]][]) => calls.map(([name]) => name)

    /**
     * each command that runs gets one pair of hooks: the command that the user called and
     * the commands that it runs (#16086 item 36)
     */
    describe('run once for each command', () => {

        it('of a protocol command of an element', async () => {
            const { browser, before, after, reset } = await session()
            const elem = await browser.$('.foo')
            reset()
            await elem.elementClick(elem.elementId)
            expect(names(before)).toEqual(['elementClick'])
            expect(names(after)).toEqual(['elementClick'])
        })

        it('of an element command and the protocol command that it runs', async () => {
            const { browser, before, after, reset } = await session()
            const elem = await browser.$('.foo')
            reset()
            await elem.getText()
            expect(names(before)).toEqual(['getText', 'getElementText'])
            expect(names(after)).toEqual(['getElementText', 'getText'])
        })

        it('of a command of a list item', async () => {
            const { browser, before, after, reset } = await session()
            const [item] = await browser.$$('.foo')
            reset()
            await item.getText()
            expect(names(before)).toEqual(['getText', 'getElementText'])
            expect(names(after)).toEqual(['getElementText', 'getText'])
        })

        it('of a custom element command and the command that it runs', async () => {
            const { browser, before, after, reset } = await session()
            browser.addCommand('textOf', function (this: WebdriverIO.Element) {
                return this.getElementText(this.elementId)
            }, { attachToElement: true })
            const elem = await browser.$('.foo')
            reset()
            // @ts-expect-error custom command
            await elem.textOf()
            expect(names(before)).toEqual(['textOf', 'getElementText'])
            expect(names(after)).toEqual(['getElementText', 'textOf'])
        })
    })

    // a retry after a stale element is part of the command: the driver events still show both requests
    it('runs the hooks once for a command that is retried after a stale element, with the final result', async () => {
        const before: [string, unknown[]][] = []
        const after: [string, unknown[], unknown, unknown][] = []
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: { browserName: 'foobar' },
            beforeCommand: [(name: string, args: unknown[]) => { before.push([name, args]) }],
            afterCommand: [(name: string, args: unknown[], result: unknown, error: unknown) => { after.push([name, args, result, error]) }]
        })
        const stale = Object.assign(new Error('stale element reference: element is not attached'), { name: 'stale element reference' })
        browser.addCommand('readOnce', vi.fn().mockRejectedValueOnce(stale).mockResolvedValueOnce('done'), { attachToElement: true })
        const elem = await browser.$('.foo')
        before.length = 0
        after.length = 0
        // @ts-expect-error custom command
        expect(await elem.readOnce('x')).toBe('done')
        expect(before.filter(([name]) => name === 'readOnce')).toEqual([['readOnce', ['x']]])
        expect(after.filter(([name]) => name === 'readOnce')).toEqual([['readOnce', ['x'], 'done', undefined]])
    })

    // beforeCommand runs after the implicit wait, so a hook sees the element that the wait found
    describe('beforeCommand of an element that was not found yet', () => {
        const session = async () => {
            const calls: [string, string, string | undefined, unknown][] = []
            const browser = await remote({
                baseUrl: 'http://foobar.com',
                waitforTimeout: 10,
                capabilities: { browserName: 'foobar' },
                beforeCommand: [function (this: WebdriverIO.Element, name: string, args: unknown[]) { calls.push(['before', name, this.elementId, args[0]]) }],
                afterCommand: [function (this: WebdriverIO.Element, name: string, args: unknown[]) { calls.push(['after', name, this.elementId, args[0]]) }]
            })
            const elem = await browser.$('.foo')
            const foundId = elem.elementId
            elem.elementId = undefined as unknown as string
            calls.length = 0
            // the wait runs its own queries (`browser.$$('.foo')`): read the calls of the given command only
            const of = (command: string, firstArg?: unknown) => calls
                .filter(([, name, , arg]) => name === command && (firstArg === undefined || arg === firstArg))
                .map(([phase, name, id]) => [phase, name, id])
            return { elem, foundId, of }
        }

        it('gets the element that the wait found', async () => {
            const { elem, foundId, of } = await session()
            await elem.getText()
            expect(of('getText')).toEqual([['before', 'getText', foundId], ['after', 'getText', foundId]])
        })

        it('gets the element that the wait found, for $$', async () => {
            const { elem, foundId, of } = await session()
            await elem.$$('.bar')
            expect(of('$$', '.bar')).toEqual([['before', '$$', foundId], ['after', '$$', foundId]])
        })

        it('runs once, before afterCommand, when the element is never found', async () => {
            const { elem, of } = await session()
            vi.mocked(waitForExist).mockRejectedValueOnce(new Error('still not existing'))
            await expect(elem.getText()).rejects.toThrow()
            expect(of('getText')).toEqual([['before', 'getText', undefined], ['after', 'getText', undefined]])
        })

        it('runs once, before afterCommand, when the parent of $$ is never found', async () => {
            const { elem, of } = await session()
            vi.mocked(waitForExist).mockRejectedValueOnce(new Error('still not existing'))
            await expect(elem.$$('.bar')).rejects.toThrow()
            expect(of('$$', '.bar')).toEqual([['before', '$$', undefined], ['after', '$$', undefined]])
        })
    })

    // the hooks get the arguments of the command, as before
    describe('arguments of the hooks', () => {
        it('of a protocol command of an element', async () => {
            const { browser, before, after, reset } = await session()
            const elem = await browser.$('.foo')
            reset()
            await elem.elementClick(elem.elementId)
            expect(before).toEqual([['elementClick', [elem.elementId]]])
            expect(after).toEqual([['elementClick', [elem.elementId]]])
        })

        it.each(['element', 'list item'])('of an element command of a %s', async (kind) => {
            const { browser, before, after, reset } = await session()
            const elem = kind === 'element' ? await browser.$('.foo') : (await browser.$$('.foo'))[0]
            reset()
            await elem.setValue('hello')
            expect(before[0]).toEqual(['setValue', ['hello']])
            expect(after.at(-1)).toEqual(['setValue', ['hello']])
        })

        it('of a custom element command', async () => {
            const { browser, before, after, reset } = await session()
            browser.addCommand('textWith', function (this: WebdriverIO.Element, suffix: string) {
                return this.getElementText(this.elementId).then((text) => text + suffix)
            }, { attachToElement: true })
            const elem = await browser.$('.foo')
            reset()
            // @ts-expect-error custom command
            await elem.textWith('!')
            expect(before[0]).toEqual(['textWith', ['!']])
            expect(after.at(-1)).toEqual(['textWith', ['!']])
        })
    })
})
