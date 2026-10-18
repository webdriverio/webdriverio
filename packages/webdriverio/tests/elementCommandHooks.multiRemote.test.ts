import path from 'node:path'
import { AsyncLocalStorage } from 'node:async_hooks'

import { describe, it, expect, vi } from 'vitest'
import { setCommandHookStore } from '@wdio/utils'
import { multiRemote } from '../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

// as in Node (src/node.ts): the 2 instances run their hooks at the same time. Its own file: the store stays in this file
setCommandHookStore(new AsyncLocalStorage<true>())

describe('element protocol command hooks of a multi-remote element', () => {
    it('runs the hooks of each instance once for a command of a multi-remote element', async () => {
        const calls: Record<string, string[]> = { browserA: [], browserB: [] }
        const hooks = (instance: string) => ({
            beforeCommand: [(name: string) => { calls[instance].push(`before ${name}`) }],
            afterCommand: [(name: string) => { calls[instance].push(`after ${name}`) }]
        })
        const browser = await multiRemote({
            browserA: { capabilities: { browserName: 'chrome' }, ...hooks('browserA') },
            browserB: { port: 4445, capabilities: { browserName: 'firefox' }, ...hooks('browserB') }
        })
        const elem = await browser.$('.foo')
        calls.browserA.length = 0
        calls.browserB.length = 0
        await elem.getText()
        for (const instance of ['browserA', 'browserB']) {
            expect(calls[instance]).toEqual(['before getText', 'before getElementText', 'after getElementText', 'after getText'])
        }
    })

    const session = async () => {
        const calls: Record<string, [string, string, unknown[]][]> = { browserA: [], browserB: [] }
        const plain = (args: unknown[]) => args.map((arg) => typeof arg === 'function' ? '<fn>' : arg)
        const hooks = (instance: string) => ({
            beforeCommand: [(name: string, args: unknown[]) => { calls[instance].push(['before', name, plain(args)]) }],
            afterCommand: [(name: string, args: unknown[]) => { calls[instance].push(['after', name, plain(args)]) }]
        })
        const browser = await multiRemote({
            browserA: { capabilities: { browserName: 'chrome' }, ...hooks('browserA') },
            browserB: { port: 4445, capabilities: { browserName: 'firefox' }, ...hooks('browserB') }
        })
        const reset = () => { calls.browserA.length = 0; calls.browserB.length = 0 }
        const of = (instance: string, ...names: string[]) => calls[instance].filter(([, name]) => names.includes(name))
        return { browser, reset, of }
    }

    it('runs the hooks of each instance once for an overwritten browser command', async () => {
        const { browser, reset, of } = await session()
        browser.overwriteCommand('getTitle', async function (origCommand) {
            return origCommand()
        })
        reset()
        await browser.getTitle()
        for (const instance of ['browserA', 'browserB']) {
            expect(of(instance, 'getTitle')).toEqual([['before', 'getTitle', []], ['after', 'getTitle', []]])
        }
    })

    it('runs the hooks of each instance once for an element command overwritten with attachToElement', async () => {
        const { browser, reset, of } = await session()
        browser.overwriteCommand('getText', async function (origCommand) {
            return origCommand()
        }, { attachToElement: true })
        const elem = await browser.$('.foo')
        reset()
        await elem.getText()
        for (const instance of ['browserA', 'browserB']) {
            expect(of(instance, 'getText')).toEqual([['before', 'getText', []], ['after', 'getText', []]])
        }
    })

    it('runs the hooks of each instance once for each query of a chain on a promise', async () => {
        const { browser, reset, of } = await session()
        reset()
        await browser.$('.foo').$('.bar')
        for (const instance of ['browserA', 'browserB']) {
            expect(of(instance, '$').filter(([phase]) => phase === 'before')).toEqual([['before', '$', ['.foo']], ['before', '$', ['.bar']]])
        }
    })
})
