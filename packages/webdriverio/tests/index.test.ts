import { describe, it, afterEach, expect, vi } from 'vitest'
import path from 'node:path'
// @ts-ignore mock feature
import { logMock } from '@wdio/logger'
import * as webdriverio from '../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('index.js', () => {
    afterEach(() => {
        delete process.env.WDIO_LOG_PATH

        logMock.error.mockRestore()
        logMock.warn.mockRestore()
        logMock.info.mockRestore()
        logMock.debug.mockRestore()
    })

    it('exports remote method', () => {
        expect(webdriverio.remote).toBeDefined()
    })

    it('exports attach method', () => {
        expect(webdriverio.attach).toBeDefined()
    })

    it('exports multiremote method', () => {
        expect(webdriverio.multiremote).toBeDefined()
    })

    it('exports remote method', () => {
        expect(webdriverio.remote).toBeDefined()
    })

    it('exports SevereServiceError class', () => {
        expect(webdriverio.SevereServiceError).toBeDefined()
    })

    it('exports key constant', () => {
        expect(webdriverio.Key).toBeDefined()
    })
})
