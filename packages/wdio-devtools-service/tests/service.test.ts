import path from 'node:path'
import { expect, test, vi, beforeEach } from 'vitest'
import puppeteer from 'puppeteer-core'

import DevToolsService from '../src/index.js'
import CommandHandlerMock from '../src/commands.js'
import { setUnsupportedCommand } from '../src/utils.js'

import logger from '@wdio/logger'

vi.mock('ws')
vi.mock('puppeteer-core')
vi.mock('lighthouse/lighthouse-core/fraggle-rock/gather/session')

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../src/commands', () => {
    const _initCommand = vi.fn()
    const _beforeCmd = vi.fn()
    const _afterCmd = vi.fn()
    const enablePerformanceAudits = vi.fn()
    const disablePerformanceAudits = vi.fn()
    const setThrottlingProfile = vi.fn()
    const checkPWA = vi.fn()
    class CommandHandlerMock {
        _initCommand = _initCommand
        _beforeCmd = _beforeCmd
        _afterCmd = _afterCmd
        enablePerformanceAudits = enablePerformanceAudits
        disablePerformanceAudits = disablePerformanceAudits
        setThrottlingProfile = setThrottlingProfile
        checkPWA = checkPWA
    }

    return { default: CommandHandlerMock }
})
const commandHandlerMock = new CommandHandlerMock({} as any, {} as any, {} as any, {} as any)

vi.mock('../src/auditor', () => {
    const updateCommandsMock = vi.fn()
    return {
        default: class {
            traceEvents: any
            logs: any
            updateCommands = updateCommandsMock

            constructor (traceEvents: any, logs: any) {
                this.traceEvents = traceEvents
                this.logs = logs
            }
        }
    }
})

vi.mock('../src/utils', async () => {
    let wasCalled = false

    return {
        findCDPInterface: vi.fn().mockImplementation(() => {
            if (!wasCalled) {
                wasCalled = true
                return 42
            }
            throw new Error('boom')
        }),
        setUnsupportedCommand: vi.fn(),
        getLighthouseDriver: vi.fn()
    }
})

const sessionMock = { send: vi.fn() }
const log = logger('')

let browser: WebdriverIO.Browser
let multiBrowser: WebdriverIO.MultiRemoteBrowser
beforeEach(() => {
    browser = {
        sessionId: vi.fn(),
        getPuppeteer: vi.fn(() => puppeteer.connect({})),
        addCommand: vi.fn(),
        emit: vi.fn(),
        getUrl: vi.fn()
    } as any

    multiBrowser = {
        instances: ['1', '2'],
        getInstance: () => {
            return {
                sessionId: vi.fn(),
                getPuppeteer: vi.fn(() => puppeteer.connect({})),
                addCommand: vi.fn(),
                emit: vi.fn(),
                getUrl: vi.fn()
            }
        },
        addCommand: vi.fn(),
    } as any

    sessionMock.send.mockClear()
    vi.mocked(log.error).mockClear()
})

test('if not supported by browser', async () => {
    const browser: any = {
        sessionId: vi.fn(),
        addCommand: vi.fn(),
        getPuppeteer: vi.fn(() => Promise.reject(new Error('ups')))
    }
    const service = new DevToolsService()
    await service.before(undefined, undefined, browser)
    expect(setUnsupportedCommand).toBeCalledTimes(1)
    expect(vi.mocked(browser.addCommand!).mock.calls).toHaveLength(0)
})

test('if supported by browser', async () => {
    const service = new DevToolsService()
    await service.before(undefined, undefined, browser)

    expect(browser.addCommand).toBeCalledWith(
        'enablePerformanceAudits', expect.any(Function))
    expect(browser.addCommand).toBeCalledWith(
        'disablePerformanceAudits', expect.any(Function))
    expect(browser.addCommand).toBeCalledWith(
        'emulateDevice', expect.any(Function))
    expect(browser.addCommand).toBeCalledWith(
        'checkPWA', expect.any(Function))
})

test('beforeCommand', async () => {
    const service = new DevToolsService()
    await service.before(undefined, undefined, browser)

    // @ts-ignore test without paramater
    await service.beforeCommand()
    expect(commandHandlerMock._beforeCmd).toBeCalledTimes(1)
})

test('afterCommand', async () => {
    const service = new DevToolsService()
    await service.before(undefined, undefined, browser)

    // @ts-ignore test without paramater
    await service.afterCommand()
    expect(commandHandlerMock._afterCmd).toBeCalledTimes(1)
})

test.skip('afterCommand: switchToWindow', async () => {
    // const service = new DevToolsService({})
    // await service.before(undefined, undefined, browser)

    // service._setupHandler = vi.fn()
    // await service.afterCommand('switchToWindow')
    // expect(service._setupHandler).toBeCalledTimes(1)
    // expect(service['_command'][0]._afterCmd).toBeCalledTimes(1)
})

test('_enablePerformanceAudits: throws if network or cpu properties have wrong types', () => {
    const service = new DevToolsService({})
    service['_browser'] = browser
    expect(
        () => service._enablePerformanceAudits({ networkThrottling: 'super fast 3g' } as any)
    ).toThrow(/Network throttling profile/)
    expect(
        () => service._enablePerformanceAudits({ networkThrottling: 'Good 3G', cpuThrottling: '34' } as any)
    ).toThrow(/CPU throttling rate needs to be typeof number/)
})

test('_enablePerformanceAudits', async () => {
    const service = new DevToolsService({})
    service['_browser'] = browser
    await service._setupHandler()
    service._enablePerformanceAudits()

    expect(service['_command'][0].enablePerformanceAudits).toBeCalledTimes(1)
})

test('_enablePerformanceAudits for multiremote', async () => {
    const service = new DevToolsService({})
    service['_browser'] = multiBrowser
    await service._setupHandler()
    service._enablePerformanceAudits()

    expect(service['_command'].length).toBe(2)
    expect(service['_command'][0].enablePerformanceAudits).toBeCalledTimes(1)
    expect(service['_command'][1].enablePerformanceAudits).toBeCalledTimes(1)
})

test('_disablePerformanceAudits', async () => {
    const service = new DevToolsService({})
    service['_browser'] = browser
    await service._setupHandler()
    service._enablePerformanceAudits({
        networkThrottling: 'Regular 2G',
        cpuThrottling: 42,
        cacheEnabled: true,
        formFactor: 'mobile'
    })
    service._disablePerformanceAudits()
    expect(service['_command'][0].disablePerformanceAudits).toBeCalledTimes(1)
})

test('_disablePerformanceAudits for multiremote', async () => {
    const service = new DevToolsService({})
    service['_browser'] = multiBrowser
    await service._setupHandler()
    service._enablePerformanceAudits({
        networkThrottling: 'Regular 2G',
        cpuThrottling: 42,
        cacheEnabled: true,
        formFactor: 'mobile'
    })
    service._disablePerformanceAudits()

    expect(service['_command'][0].disablePerformanceAudits).toBeCalledTimes(1)
    expect(service['_command'][1].disablePerformanceAudits).toBeCalledTimes(1)
})

test('_setThrottlingProfile', async () => {
    const service = new DevToolsService({})
    service['_browser'] = browser
    await service._setupHandler()

    await service._setThrottlingProfile('Good 3G', 4, true)
    expect(service['_command'][0].setThrottlingProfile).toBeCalledTimes(1)
})

test('_setThrottlingProfile for multiremote', async () => {
    const service = new DevToolsService({})
    service['_browser'] = multiBrowser
    await service._setupHandler()
    await service._setThrottlingProfile('Good 3G', 4, true)

    expect(service['_command'][0].setThrottlingProfile).toBeCalledTimes(1)
    expect(service['_command'][1].setThrottlingProfile).toBeCalledTimes(1)
})

test('_emulateDevice', async () => {
    const service = new DevToolsService({})
    service['_browser'] = browser
    await service._setupHandler()

    await service._emulateDevice('Nexus 6P')
    expect(service['_command'][0].emulateDevice).toBeCalledTimes(1)
})

test('_emulateDevice for multiremote', async () => {
    const service = new DevToolsService({})
    service['_browser'] = multiBrowser
    await service._setupHandler()
    await service._emulateDevice('Nexus 6P')

    expect(service['_command'][0].emulateDevice).toBeCalledTimes(1)
    expect(service['_command'][1].emulateDevice).toBeCalledTimes(1)
})

test('_checkPWA', async () => {
    const service = new DevToolsService({})
    service['_browser'] = browser
    await service._setupHandler()

    await service._checkPWA()
    expect(service['_command'][0].checkPWA).toBeCalledTimes(1)
})

test('_checkPWA for multiremote', async () => {
    const service = new DevToolsService({})
    await service.before(undefined, undefined, multiBrowser)
    // await service._checkPWA()

    expect(commandHandlerMock.checkPWA).toBeCalledTimes(2)
})

test('before hook', async () => {
    const service = new DevToolsService({})
    service._setupHandler = vi.fn()
    service.before({}, [], browser)
    expect(service._setupHandler).toBeCalledTimes(1)
})

test('onReload hook', async () => {
    const service = new DevToolsService({})
    service['_browser'] = browser
    service._setupHandler = vi.fn()
    ;(service['_browser'] as any).puppeteer = 'suppose to be reset after reload' as any
    service.onReload()
    expect(service._setupHandler).toBeCalledTimes(1)
})
