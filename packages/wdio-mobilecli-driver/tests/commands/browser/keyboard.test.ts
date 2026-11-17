import path from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'

import { hideKeyboard } from '../../../src/commands/browser/hideKeyboard.js'
import { isKeyboardShown } from '../../../src/commands/browser/isKeyboardShown.js'
import { RpcClient } from '../../../src/rpc.js'
import { IOS_DEVICE, ServerError, getRequests, mockServer } from '../../__fixtures__/server.js'
import { createSession } from '../../__fixtures__/session.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

describe('isKeyboardShown', () => {
    it('says if the keyboard is on the screen', async () => {
        const keyboard = { visible: true }
        const fetchMock = mockServer({ 'device.io.keyboard.status': () => keyboard })

        expect(await isKeyboardShown(createSession())).toBe(true)
        expect(getRequests(fetchMock)).toEqual([
            { method: 'device.io.keyboard.status', params: { deviceId: IOS_DEVICE.id } }
        ])

        keyboard.visible = false
        expect(await isKeyboardShown(createSession())).toBe(false)
    })
})

describe('hideKeyboard', () => {
    it('hides the keyboard', async () => {
        const fetchMock = mockServer({ 'device.io.keyboard.hide': () => ({ dismissed: true }) })

        expect(await hideKeyboard(createSession())).toBe(null)

        expect(getRequests(fetchMock)).toEqual([
            { method: 'device.io.keyboard.hide', params: { deviceId: IOS_DEVICE.id } }
        ])
    })

    it('gives mobilecli at least a minute, the first hide in an app can be slow', async () => {
        mockServer({ 'device.io.keyboard.hide': () => ({ dismissed: true }) })
        const session = createSession()
        session.rpc = new RpcClient('http://localhost:12000/rpc', 1000)
        const call = vi.spyOn(session.rpc, 'call')

        await hideKeyboard(session)

        expect(call).toHaveBeenCalledWith('device.io.keyboard.hide', { deviceId: IOS_DEVICE.id }, 60000, { mask: false })
    })

    it('does not wait longer than a minute, also if other calls to mobilecli may take longer', async () => {
        mockServer({ 'device.io.keyboard.hide': () => ({ dismissed: true }) })
        const session = createSession()
        session.rpc = new RpcClient('http://localhost:12000/rpc', 120000)
        const call = vi.spyOn(session.rpc, 'call')

        await hideKeyboard(session)

        expect(call).toHaveBeenCalledWith('device.io.keyboard.hide', { deviceId: IOS_DEVICE.id }, 60000, { mask: false })
    })

    it('waits less with a shorter setting keyboardTimeout', async () => {
        mockServer({ 'device.io.keyboard.hide': () => ({ dismissed: true }) })
        const session = createSession(undefined, undefined, { keyboardTimeout: 5000 })
        session.rpc = new RpcClient('http://localhost:12000/rpc', 120000)
        const call = vi.spyOn(session.rpc, 'call')

        await hideKeyboard(session)

        expect(call).toHaveBeenCalledWith('device.io.keyboard.hide', { deviceId: IOS_DEVICE.id }, 5000, { mask: false })
    })

    it('gives mobilecli the time of the setting keyboardTimeout', async () => {
        mockServer({ 'device.io.keyboard.hide': () => ({ dismissed: true }) })
        const session = createSession(undefined, undefined, { keyboardTimeout: 90000 })
        session.rpc = new RpcClient('http://localhost:12000/rpc', 1000)
        const call = vi.spyOn(session.rpc, 'call')

        await hideKeyboard(session)

        expect(call).toHaveBeenCalledWith('device.io.keyboard.hide', { deviceId: IOS_DEVICE.id }, 90000, { mask: false })
    })

    it('throws the reason of mobilecli if the keyboard can not be hidden', async () => {
        mockServer({
            'device.io.keyboard.hide': () => {
                throw new ServerError('failed to hide keyboard: keyboard is still visible')
            }
        })

        await expect(hideKeyboard(createSession())).rejects.toThrow('failed to hide keyboard: keyboard is still visible')
    })
})
