import path from 'node:path'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import logger from '@wdio/logger'
import { CommandRuntimeOptions } from 'webdriver'

import { addElementCommands, getProtocolCommands, getShownArgs } from '../../src/commands/index.js'
import type { Session } from '../../src/types.js'
import { IOS_DEVICE, getRequests } from '../__fixtures__/server.js'
import { createSession, findElementId, getMethods, mockInput } from '../__fixtures__/session.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

type Commands = Record<string, (...args: unknown[]) => Promise<unknown>>

describe('getProtocolCommands', () => {
    let session: Session
    let client: Commands & { emit: ReturnType<typeof vi.fn> }

    beforeEach(() => {
        session = createSession()
        client = Object.create({}, {
            ...getProtocolCommands(session),
            emit: { value: vi.fn() }
        })
    })

    it('has the browser and the element commands of the driver', () => {
        for (const name of [
            'deleteSession', 'findElement', 'findElements', 'getPageSource', 'getTimeouts', 'getWindowHandle', 'hideKeyboard',
            'isKeyboardShown', 'setTimeouts', 'elementClear', 'elementClick', 'elementSendKeys', 'getElementProperty',
            'getElementText', 'isElementDisplayed', 'isElementEnabled'
        ]) {
            expect(client[name]).toEqual(expect.any(Function))
        }
    })

    it('calls a command with the session and its parameters', async () => {
        expect(await client.setTimeouts(1000)).toBe(null)
        expect(session.timeouts).toEqual({ implicit: 1000 })
    })

    it('says that a WebDriver or Appium command is not supported', async () => {
        await expect(client.navigateTo('https://webdriver.io'))
            .rejects.toThrow('The command "navigateTo" is not supported by @wdio/mobilecli-driver')
        await expect(client.getAppiumContexts())
            .rejects.toThrow('The command "getAppiumContexts" is not supported by @wdio/mobilecli-driver')
        await expect(client.executeScript('mobile: tap', [{ x: 1, y: 2 }]))
            .rejects.toThrow('The command "executeScript" is not supported by @wdio/mobilecli-driver')
    })

    it('waits as long as WebdriverIO says with waitforTimeout and waitforInterval', async () => {
        await client.getTimeouts()
        expect(session.wait).toEqual({ timeout: 5000, interval: 100 })

        Object.defineProperty(client, 'options', { value: { waitforTimeout: 10000, waitforInterval: 250 } })
        await client.getTimeouts()
        expect(session.wait).toEqual({ timeout: 10000, interval: 250 })
    })

    it('waits as long as the settings of the driver say, before what WebdriverIO says', async () => {
        Object.defineProperty(client, 'options', { value: { waitforTimeout: 10000, waitforInterval: 250 } })
        session.settings.actionTimeout = 2000
        session.settings.pollInterval = 20

        await client.getTimeouts()
        expect(session.wait).toEqual({ timeout: 2000, interval: 20 })
    })

    it('waits as long as setTimeouts said for the commands after it', async () => {
        session.settings.actionTimeout = 2000

        await client.setTimeouts(8000)
        expect(await client.getTimeouts()).toEqual({ implicit: 8000 })
        expect(session.wait).toEqual({ timeout: 8000, interval: 100 })
    })

    it('does not run a command after the session has ended', async () => {
        await client.deleteSession()
        await expect(client.setTimeouts(1)).rejects.toThrow('Can not run "setTimeouts": the session session-1 has ended')
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

    it('hides the text of addValue(text, { mask: true }) in the log and the events, and types it', async () => {
        const fetchMock = mockInput({ focused: true })
        const input = await findElementId(session, 'accessibility id', 'text-input')
        const log = logger('test')
        vi.mocked(log.info).mockClear()
        vi.mocked(log.debug).mockClear()

        await client.elementSendKeys(input, 'secret', new CommandRuntimeOptions({ mask: true }))

        expect(client.emit.mock.calls.map(([, event]) => event.body.args)).toEqual([[input, '**MASKED**'], [input, '**MASKED**']])
        const logged = JSON.stringify([...vi.mocked(log.info).mock.calls, ...vi.mocked(log.debug).mock.calls])
        expect(logged).not.toContain('secret')
        expect(logged).toContain('**MASKED**')
        expect(getRequests(fetchMock).at(-1)).toEqual({ method: 'device.io.text', params: { deviceId: IOS_DEVICE.id, text: 'secret' } })
    })

    it('emits the error of a command', async () => {
        const error = await client.navigateTo('https://webdriver.io').catch((err) => err)

        expect(client.emit).toHaveBeenLastCalledWith('result', expect.objectContaining({
            command: 'navigateTo',
            result: { error }
        }))
    })
})

describe('getShownArgs', () => {
    it('hides the text of a command that types, with { mask: true }', () => {
        expect(getShownArgs('elementSendKeys', ['element-1', 'secret', new CommandRuntimeOptions({ mask: true })])).toEqual(['element-1', '**MASKED**'])
        expect(getShownArgs('setElementValue', ['element-1', 'secret', new CommandRuntimeOptions({ mask: true })])).toEqual(['element-1', '**MASKED**'])
    })

    it('shows the text without { mask: true }, and not the options', () => {
        expect(getShownArgs('elementSendKeys', ['element-1', 'Hello', new CommandRuntimeOptions({ mask: false })])).toEqual(['element-1', 'Hello'])
        expect(getShownArgs('elementSendKeys', ['element-1', 'Hello'])).toEqual(['element-1', 'Hello'])
    })

    it('does not hide an empty text or the parameters of other commands', () => {
        expect(getShownArgs('elementSendKeys', ['element-1', '', new CommandRuntimeOptions({ mask: true })])).toEqual(['element-1', ''])
        expect(getShownArgs('elementClick', ['element-1', new CommandRuntimeOptions({ mask: true })])).toEqual(['element-1'])
    })
})

describe('addElementCommands', () => {
    const getCommands = (session = createSession()) => {
        const client = { overwriteCommand: vi.fn() }
        expect(addElementCommands(client, session)).toBe(client)
        return Object.fromEntries(client.overwriteCommand.mock.calls.map(([name, command, options]) => {
            expect(options).toEqual({ attachToElement: true })
            return [name, command]
        }))
    }

    /**
     * an element of WebdriverIO, for the commands that the driver replaces
     */
    const createElement = (elementId?: string) => ({
        elementId,
        emit: vi.fn(),
        click: vi.fn().mockResolvedValue(undefined),
        waitForExist: vi.fn()
    })

    it('changes tap() and setValue() of an element and no other command', () => {
        expect(Object.keys(getCommands())).toEqual(['tap', 'setValue'])
    })

    it('makes tap() of an element the same as click()', async () => {
        const element = createElement('element-1')

        await getCommands().tap.call(element, vi.fn())

        expect(element.click).toHaveBeenCalledWith()
    })

    it('makes setValue() of an element one fill', async () => {
        const session = createSession()
        const fetchMock = mockInput()
        const element = createElement(await findElementId(session, 'accessibility id', 'text-input'))
        const original = vi.fn()
        fetchMock.mockClear()

        await getCommands(session).setValue.call(element, original, 'Hello')
        await getCommands(session).setValue.call(element, original, 42)

        expect(getMethods(fetchMock).filter((method) => method.startsWith('io.'))).toEqual(['io.tap', 'io.fill', 'io.tap', 'io.fill'])
        expect(original).not.toHaveBeenCalled()
    })

    it('logs the fill and tells the reporters about it, as a command', async () => {
        const session = createSession()
        mockInput()
        const element = createElement(await findElementId(session, 'accessibility id', 'text-input'))

        await getCommands(session).setValue.call(element, vi.fn(), 'Hello')

        expect(element.emit.mock.calls.map(([name, event]) => [name, event.command])).toEqual([
            ['command', 'setElementValue'],
            ['result', 'setElementValue']
        ])
    })

    it('does not make the fill a command of the session', () => {
        const client = Object.create({}, getProtocolCommands(createSession()))
        expect(client.setElementValue).toBe(undefined)
        expect(client.mobilecliFill).toBe(undefined)
    })

    it('hides the text of setValue(text, { mask: true }) in the log and the events, and fills it', async () => {
        const session = createSession()
        const fetchMock = mockInput()
        const element = createElement(await findElementId(session, 'accessibility id', 'text-input'))
        const log = logger('test')
        vi.mocked(log.info).mockClear()
        vi.mocked(log.debug).mockClear()

        await getCommands(session).setValue.call(element, vi.fn(), 'secret', { mask: true })

        expect(element.emit.mock.calls.map(([, event]) => event.body.args)).toEqual([
            [element.elementId, '**MASKED**'],
            [element.elementId, '**MASKED**']
        ])
        const logged = JSON.stringify([...vi.mocked(log.info).mock.calls, ...vi.mocked(log.debug).mock.calls])
        expect(logged).not.toContain('secret')
        expect(getRequests(fetchMock).at(-1)).toEqual({ method: 'device.io.fill', params: { deviceId: IOS_DEVICE.id, text: 'secret' } })
    })

    it('waits for an element that is not on the screen yet before setValue() fills it', async () => {
        const session = createSession()
        const fetchMock = mockInput()
        const element = createElement()
        element.waitForExist.mockImplementation(async () => {
            element.elementId = await findElementId(session, 'accessibility id', 'text-input')
        })

        await getCommands(session).setValue.call(element, vi.fn(), 'Hello')

        expect(element.waitForExist).toHaveBeenCalledTimes(1)
        expect(getMethods(fetchMock).at(-1)).toBe('io.fill')
    })

    it('does not wait in setValue() for an element that was found', async () => {
        const session = createSession()
        mockInput()
        const element = createElement(await findElementId(session, 'accessibility id', 'text-input'))

        await getCommands(session).setValue.call(element, vi.fn(), 'Hello')

        expect(element.waitForExist).not.toHaveBeenCalled()
    })

    it('only takes a string or a number for setValue()', async () => {
        const fetchMock = mockInput()
        const element = createElement('element-1')

        await expect(getCommands().setValue.call(element, vi.fn(), ['a']))
            .rejects.toThrow('The setValue command only takes string or number values.')
        expect(fetchMock).not.toHaveBeenCalled()
    })
})
