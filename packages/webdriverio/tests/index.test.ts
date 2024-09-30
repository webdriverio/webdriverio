import { describe, it, afterEach, expect, vi } from 'vitest'
import path from 'node:path'
// @ts-ignore mock feature
import { logMock } from '@wdio/logger'
import * as webdriverio from '../src/index.js'
import { transformClassicToBidiSelector } from '../src/utils/index.js'

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

    it('transforms classic css selector to BiDi', () => {
        const bidiSelector = transformClassicToBidiSelector('css selector', '.red')
        expect(bidiSelector.type).toBe('css')
        expect(bidiSelector.value).toBe('.red')
    })
    
    it('transforms classic tag name selector to BiDi', () => {
        const bidiSelector = transformClassicToBidiSelector('tag name', 'div')
        expect(bidiSelector.type).toBe('css')
        expect(bidiSelector.value).toBe('div')
    })

    it('transforms classic xpath selector to BiDi', () => {
        const bidiSelector = transformClassicToBidiSelector('xpath', '//html/body/section/div[6]/div/span')
        expect(bidiSelector.type).toBe('xpath')
        expect(bidiSelector.value).toBe('//html/body/section/div[6]/div/span')
    })

    it('transforms classic link text selector to BiDi', () => {
        const bidiSelector = transformClassicToBidiSelector('link text', 'GitHub Repo')
        expect(bidiSelector.type).toBe('innerText')
        expect(bidiSelector.value).toBe('GitHub Repo')
    })

    it('transforms classic partial link text selector to BiDi', () => {
        const bidiSelector = transformClassicToBidiSelector('partial link text', 'new')
        expect(bidiSelector.type).toBe('innerText')
        expect(bidiSelector.value).toBe('new')
        expect(bidiSelector.matchType).toBe('partial')
    })
})
