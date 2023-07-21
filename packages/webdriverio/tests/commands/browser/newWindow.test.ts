/**
 * @vitest-environment jsdom
 */
import path from 'node:path'
import { expect, describe, beforeEach, afterEach, it, vi } from 'vitest'
// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src/index.js'

import type { Capabilities } from '@wdio/types'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('newWindow', () => {
    beforeEach(() => {
        global.window.open = vi.fn()
    })

    afterEach(() => {
        got.mockClear()
        vi.mocked(global.window.open).mockRestore()
    })

    it('should allow to create a new window handle', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        got.setMockResponse([
            [],
            null,
            [],
            [],
            [],
            ['new-window-handle'],
            null
        ])

        const newHandle = await browser.newWindow('https://webdriver.io', {
            windowName: 'some name',
            windowFeatures: 'some params'
        })
        expect(newHandle).toBe('new-window-handle')
        expect(got.mock.calls).toHaveLength(8)
        expect(got.mock.calls[2][1].json.args)
            .toEqual(['https://webdriver.io', 'some name', 'some params'])
        expect(got.mock.calls[3][0].pathname)
            .toContain('/window/handles')
    })

    it('should apply default args', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        got.setMockResponse([
            [],
            null,
            [],
            ['new-window-handle'],
            null
        ])

        await browser.newWindow('https://webdriver.io')
        expect(got.mock.calls).toHaveLength(6)
        expect(got.mock.calls[2][1].json.args)
            .toEqual(['https://webdriver.io', '', ''])
    })

    it('should fail if url is invalid', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        // @ts-ignore uses expect-webdriverio
        expect.hasAssertions()

        try {
            // @ts-expect-error
            await browser.newWindow({})
        } catch (err: any) {
            expect(err.message).toContain('number or type')
        }
    })

    it('should fail if browser is a mobile device', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'ipad',
                // @ts-ignore mock feature
                mobileMode: true
            } as Capabilities.DesiredCapabilities
        })

        const error = await browser.newWindow('https://webdriver.io', {
            windowName: 'some name',
            windowFeatures: 'some params'
        }).catch((err: Error) => err) as Error
        expect(error.message).toContain('not supported on mobile')
    })
})
