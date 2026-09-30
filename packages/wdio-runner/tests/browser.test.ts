import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ELEMENT_KEY } from 'webdriver'
import { MESSAGE_TYPES, browserChannelMessage, type Workers } from '@wdio/types'

import { remote } from '../../webdriverio/src/index.js'
import BrowserFramework from '../src/browser.js'
import type BaseReporter from '../src/reporter.js'

const globals = vi.hoisted(() => ({ browser: undefined as unknown }))

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('@wdio/globals', () => ({
    get browser () {
        return globals.browser
    }
}))

type MessageHandler = (cmd: Workers.WorkerCommand) => Promise<void>

/**
 * Runs a command that the page sends to the worker, and returns the result
 * that the worker sends back to the page.
 */
async function runCommand (handler: MessageHandler, commandName: string) {
    const send = process.send as ReturnType<typeof vi.fn>
    send.mockClear()
    await handler({
        command: 'workerRequest',
        args: {
            id: 1,
            message: browserChannelMessage(MESSAGE_TYPES.commandRequestMessage, { id: 1, cid: '0-0', commandName, args: [] })
        }
    } as unknown as Workers.WorkerCommand)
    return send.mock.calls[0][0].args.message.value
}

/**
 * The page cannot receive WebdriverIO objects, so the worker reads the
 * `wdio.kind` brand of a command result and sends element references.
 */
describe('BrowserFramework command results', () => {
    const originalSend = process.send
    let handler: MessageHandler
    let browser: WebdriverIO.Browser

    beforeEach(async () => {
        browser = await remote({ capabilities: { browserName: 'foobar' } })
        globals.browser = browser
        process.send = vi.fn() as unknown as typeof process.send

        const on = vi.spyOn(process, 'on').mockImplementation(() => process)
        new BrowserFramework('0-0', {} as WebdriverIO.Config, [], {} as BaseReporter)
        handler = on.mock.calls.find(([event]) => event === 'message')![1] as MessageHandler
        on.mockRestore()
    })

    afterEach(() => {
        process.send = originalSend
    })

    it('sends an element as an element reference', async () => {
        browser.addCommand('getElement', () => browser.$('#foo'))
        const elem = await browser.$('#foo')

        expect(await runCommand(handler, 'getElement')).toEqual({
            id: 1,
            result: { [ELEMENT_KEY]: elem.elementId }
        })
    })

    it('sends an element list as a list of element references', async () => {
        browser.addCommand('getElements', () => browser.$$('#foo'))
        const elems = await browser.$$('#foo')

        const { result } = await runCommand(handler, 'getElements')
        expect(result).toEqual([...elems].map((elem) => ({ [ELEMENT_KEY]: elem.elementId })))
        expect(result.length).toBeGreaterThan(0)
    })

    it('sends a plain object as it is, also when it looks like an element', async () => {
        class Element {
            elementId = 'foo'
        }
        const value = { foundWith: '$$', selector: '#foo' }
        browser.addCommand('getPlainList', () => value)
        browser.addCommand('getPlainElement', () => new Element())

        expect(await runCommand(handler, 'getPlainList')).toEqual({ id: 1, result: value })
        expect(await runCommand(handler, 'getPlainElement')).toEqual({ id: 1, result: { elementId: 'foo' } })
    })
})
