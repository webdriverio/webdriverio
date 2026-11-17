import path from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'

import { findElement } from '../../../src/commands/browser/findElement.js'
import { ANDROID_DEVICE, IOS_DEVICE, ServerError, getRequests, mockServer } from '../../__fixtures__/server.js'
import { ANDROID_TREE, IOS_TREE } from '../../__fixtures__/trees.js'
import { ELEMENT_KEY, createSession, mockScreen } from '../../__fixtures__/session.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

type Reference = Record<string, string>

describe('findElement', () => {
    it('finds an element in the UI tree of the device of the session', async () => {
        const session = createSession()
        const { fetchMock } = mockScreen(IOS_TREE)

        const element = await findElement(session, 'accessibility id', 'com.apple.settings.general') as Reference

        expect(getRequests(fetchMock)).toEqual([
            { method: 'device.dump.ui', params: { deviceId: IOS_DEVICE.id } }
        ])
        expect(Object.keys(element)).toEqual([ELEMENT_KEY])
        expect(session.elements.resolve(element[ELEMENT_KEY], IOS_TREE, 'ios').ref).toBe('@e4')
    })

    it('returns the first of several elements', async () => {
        const session = createSession()
        mockScreen(IOS_TREE)

        const element = await findElement(session, 'class name', 'XCUIElementTypeButton') as Reference

        expect(session.elements.resolve(element[ELEMENT_KEY], IOS_TREE, 'ios').ref).toBe('@e4')
    })

    it('matches with the platform of the device', async () => {
        const session = createSession(ANDROID_DEVICE)
        mockScreen(ANDROID_TREE)

        const element = await findElement(session, 'id', 'username') as Reference

        expect(session.elements.resolve(element[ELEMENT_KEY], ANDROID_TREE, 'android').identifier)
            .toBe('com.example.app:id/username')
    })

    it('gives an element the same id when it is found again', async () => {
        const session = createSession()
        mockScreen(IOS_TREE)

        expect(await findElement(session, 'accessibility id', 'com.apple.settings.general'))
            .toEqual(await findElement(session, 'accessibility id', 'com.apple.settings.general'))
    })

    it('returns the no such element error, and does not throw it', async () => {
        const session = createSession()
        mockScreen(IOS_TREE)

        expect(await findElement(session, 'accessibility id', 'nope')).toEqual({
            error: 'no such element',
            message: 'No element on the screen matches the selector "nope" (accessibility id)',
            stacktrace: ''
        })
    })

    it('finds nothing on a screen without elements', async () => {
        const session = createSession()
        mockScreen()

        expect(await findElement(session, 'accessibility id', 'Settings')).toEqual(expect.objectContaining({ error: 'no such element' }))
    })

    it.each([
        ['xpath', '//XCUIElementTypeButton'],
        ['css selector', '.button'],
        ['-ios predicate string', 'label == "General"'],
        ['-android uiautomator', 'new UiSelector().text("Login")']
    ])('throws an invalid selector error for the strategy "%s"', async (using, value) => {
        const { fetchMock } = mockScreen(IOS_TREE)

        await expect(findElement(createSession(), using, value)).rejects.toThrow(expect.objectContaining({
            name: 'invalid selector',
            message: `The selector "${value}" uses the strategy "${using}", which @wdio/mobilecli-driver does not support. ` +
                'Supported are: accessibility id, id, class name.'
        }))
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('throws the error of mobilecli if the UI tree can not be read', async () => {
        mockServer({
            'device.dump.ui': () => {
                throw new ServerError('failed to dump UI from device 0564A930: agent not running')
            }
        })

        await expect(findElement(createSession(), 'accessibility id', 'Settings'))
            .rejects.toThrow('failed to dump UI from device 0564A930: agent not running')
    })
})
