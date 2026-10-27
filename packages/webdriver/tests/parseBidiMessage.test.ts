import path from 'node:path'
import { EventEmitter } from 'node:events'
import { AsyncLocalStorage, AsyncResource } from 'node:async_hooks'

import { describe, it, expect, vi } from 'vitest'
import { setUserCommandStore, registerUserCommands, runUserCommand } from '@wdio/utils'

import '../src/browser.js'
import { parseBidiMessage } from '../src/utils.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('parseBidiMessage', () => {
    it('runs the listeners of an event outside of the user command that opened the socket', async () => {
        setUserCommandStore(new AsyncLocalStorage())
        registerUserCommands(['reloadSession', 'getText'])
        const browser = Object.assign(new EventEmitter(), { isBidi: true, options: {} })
        const commands: string[] = []
        browser.on('userCommand', (payload: { command: string }) => commands.push(payload.command))

        // a socket opened in `reloadSession` calls its listeners in the context of that command
        let onMessage: ((data: string) => void) | undefined
        await runUserCommand(browser, 'reloadSession', [], async () => {
            onMessage = AsyncResource.bind((data: string) => parseBidiMessage.call(browser, data as never))
        })

        const ran = new Promise<void>((resolve) => browser.once('log.entryAdded', async () => {
            await runUserCommand(browser, 'getText', [], async () => 'hello')
            resolve()
        }))
        onMessage!(JSON.stringify({ type: 'event', method: 'log.entryAdded', params: {} }))
        await ran
        expect(commands).toEqual(['reloadSession', 'getText'])
    })
})
