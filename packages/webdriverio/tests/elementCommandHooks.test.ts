import path from 'node:path'

import { describe, it, expect, vi } from 'vitest'
import { remote } from '../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

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

    /**
     * each command that runs gets one pair of hooks: the command that the user called and
     * the commands that it runs (#16086 item 36)
     */
    describe('run once for each command', () => {
        const session = async () => {
            const before: string[] = []
            const after: string[] = []
            const browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar' },
                beforeCommand: [(name: string) => { before.push(name) }],
                afterCommand: [(name: string) => { after.push(name) }]
            })
            return { browser, before, after, reset: () => { before.length = 0; after.length = 0 } }
        }

        it('of a protocol command of an element', async () => {
            const { browser, before, after, reset } = await session()
            const elem = await browser.$('.foo')
            reset()
            await elem.elementClick(elem.elementId)
            expect(before).toEqual(['elementClick'])
            expect(after).toEqual(['elementClick'])
        })

        it('of an element command and the protocol command that it runs', async () => {
            const { browser, before, after, reset } = await session()
            const elem = await browser.$('.foo')
            reset()
            await elem.getText()
            expect(before).toEqual(['getText', 'getElementText'])
            expect(after).toEqual(['getElementText', 'getText'])
        })

        it('of a command of a list item', async () => {
            const { browser, before, after, reset } = await session()
            const [item] = await browser.$$('.foo')
            reset()
            await item.getText()
            expect(before).toEqual(['getText', 'getElementText'])
            expect(after).toEqual(['getElementText', 'getText'])
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
            expect(before).toEqual(['textOf', 'getElementText'])
            expect(after).toEqual(['getElementText', 'textOf'])
        })
    })

    // the hooks get the arguments of the command, as before
    describe('arguments of the hooks', () => {
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
