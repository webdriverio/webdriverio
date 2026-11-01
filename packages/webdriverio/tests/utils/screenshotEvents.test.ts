import { AsyncLocalStorage } from 'node:async_hooks'
import { describe, it, expect, vi } from 'vitest'
import { setUserCommandStore, registerUserCommands, runUserCommand } from '@wdio/utils'

import { withScreenshotEvents } from '../../src/utils/screenshotEvents.js'
import { FOREIGN_ELEMENT_ENDPOINTS } from '../../src/utils/foreignContext.js'

const screenshotEvent = { command: 'takeScreenshot', method: 'GET', endpoint: '/session/:sessionId/screenshot', body: {} }

describe('withScreenshotEvents', () => {
    it('sends the command event, then the result event with the screenshot', async () => {
        const browser = { emit: vi.fn() } as unknown as WebdriverIO.Browser
        await expect(withScreenshotEvents(browser, 'takeScreenshot', () => Promise.resolve('data'))).resolves.toBe('data')
        expect(vi.mocked(browser.emit).mock.calls).toEqual([
            ['command', screenshotEvent],
            ['result', { ...screenshotEvent, result: { value: 'data' } }]
        ])
    })

    it('gives the events the user command that takes the screenshot as owner, not as parent', async () => {
        setUserCommandStore(new AsyncLocalStorage())
        registerUserCommands(['saveScreenshot'])
        const browser = { isBidi: true, options: { userCommandEvents: true }, emit: vi.fn() } as unknown as WebdriverIO.Browser
        await runUserCommand(browser, 'saveScreenshot', ['a.png'], () => withScreenshotEvents(browser, 'takeScreenshot', () => Promise.resolve('data')))
        const calls = vi.mocked(browser.emit).mock.calls.filter(([event]) => event === 'command' || event === 'result')
        const [[, userCommand]] = vi.mocked(browser.emit).mock.calls as [string, { id: number }][]
        expect(calls).toEqual([
            ['command', { ...screenshotEvent, owner: userCommand.id }],
            ['result', { ...screenshotEvent, owner: userCommand.id, result: { value: 'data' } }]
        ])
    })

    it('sends the error of a failed capture as result, and throws it again', async () => {
        const browser = { emit: vi.fn() } as unknown as WebdriverIO.Browser
        const error = new Error('no such frame')
        await expect(withScreenshotEvents(browser, 'takeScreenshot', () => Promise.reject(error))).rejects.toBe(error)
        expect(vi.mocked(browser.emit).mock.calls).toEqual([
            ['command', screenshotEvent],
            ['result', { ...screenshotEvent, result: { error } }]
        ])
    })

    it('sends the events of takeElementScreenshot for an element in another tab or window', async () => {
        const browser = {
            emit: vi.fn(),
            browsingContextCaptureScreenshot: vi.fn().mockResolvedValue({ data: 'element data' })
        }
        const held = {
            isFrame: false,
            browser,
            execute: vi.fn()
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce({ x: 1, y: 2, width: 3, height: 4 })
                .mockResolvedValueOnce({ x: 0, y: 0 })
        } as unknown as WebdriverIO.BrowsingContext

        await expect(FOREIGN_ELEMENT_ENDPOINTS.takeElementScreenshot(held, 'element-1')).resolves.toBe('element data')
        const event = { command: 'takeElementScreenshot', method: 'GET', endpoint: '/session/:sessionId/element/element-1/screenshot', body: {} }
        expect(browser.emit.mock.calls).toEqual([
            ['command', event],
            ['result', { ...event, result: { value: 'element data' } }]
        ])
    })
})
