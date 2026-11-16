import path from 'node:path'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { getProtocolCommands } from '../src/commands.js'
import { RpcClient } from '../src/rpc.js'
import type { Session } from '../src/types.js'
import { IOS_DEVICE } from './__fixtures__/server.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

type Commands = Record<string, (...args: unknown[]) => Promise<unknown>>

describe('getProtocolCommands', () => {
    let session: Session
    let client: Commands & { emit: ReturnType<typeof vi.fn> }

    beforeEach(() => {
        session = {
            id: 'session-1',
            rpc: new RpcClient('http://localhost:12000/rpc'),
            device: IOS_DEVICE,
            timeouts: {},
            ended: false
        }
        client = Object.create({}, {
            ...getProtocolCommands(session),
            emit: { value: vi.fn() }
        })
    })

    it('remembers the timeouts', async () => {
        expect(await client.getTimeouts()).toEqual({})

        expect(await client.setTimeouts(1000, undefined, 3000)).toBe(null)
        expect(await client.getTimeouts()).toEqual({ implicit: 1000, script: 3000 })

        await client.setTimeouts(undefined, 2000)
        expect(await client.getTimeouts()).toEqual({ implicit: 1000, pageLoad: 2000, script: 3000 })
    })

    it('ends the session with deleteSession', async () => {
        expect(await client.deleteSession()).toBe(null)
        expect(session.ended).toBe(true)
        await expect(client.setTimeouts(1)).rejects.toThrow('Can not run "setTimeouts": the session session-1 has ended')
    })

    it('says that a WebDriver or Appium command is not supported', async () => {
        await expect(client.navigateTo('https://webdriver.io'))
            .rejects.toThrow('The command "navigateTo" is not supported by @wdio/mobilecli-driver')
        await expect(client.getAppiumContexts())
            .rejects.toThrow('The command "getAppiumContexts" is not supported by @wdio/mobilecli-driver')
    })

    it('emits the command and its result, as reporters and services listen to them', async () => {
        await client.setTimeouts(1000)

        const event = {
            command: 'setTimeouts',
            method: 'POST',
            endpoint: 'http://localhost:12000/rpc',
            body: { args: [1000] }
        }
        expect(client.emit.mock.calls).toEqual([
            ['command', event],
            ['result', { ...event, result: { value: null } }]
        ])
    })

    it('emits the error of a command', async () => {
        const error = await client.navigateTo('https://webdriver.io').catch((err) => err)

        expect(client.emit).toHaveBeenLastCalledWith('result', expect.objectContaining({
            command: 'navigateTo',
            result: { error }
        }))
    })
})
