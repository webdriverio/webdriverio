import path from 'node:path'
import { expect, test, vi, beforeEach } from 'vitest'
import puppeteer from 'puppeteer-core'

import DevToolsService from '../src/index.js'
import { setUnsupportedCommand } from '../src/utils.js'

import logger from '@wdio/logger'

vi.mock('ws')
vi.mock('puppeteer-core')
vi.mock('lighthouse/lighthouse-core/fraggle-rock/gather/session')

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../src/commands', () => {
    class CommandHandlerMock {
        cdp = vi.fn()
        _initCommand = vi.fn()
        _beforeCmd = vi.fn()
        _afterCmd = vi.fn()
        enablePerformanceAudits = vi.fn()
        disablePerformanceAudits = vi.fn()
        setThrottlingProfile = vi.fn()
        emulateDevice = vi.fn()
        checkPWA = vi.fn()
        getCoverageReport = vi.fn()
        _logCoverage = vi.fn()
    }

    return { default: CommandHandlerMock }
})

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
    const service = new DevToolsService({})
    service['_browser'] = {
        sessionId: vi.fn(),
        addCommand: vi.fn(),
        getPuppeteer: vi.fn(() => Promise.reject(new Error('ups')))
    } as any

    await service._setupHandler()
    expect(setUnsupportedCommand).toBeCalledTimes(1)
    expect(vi.mocked(service['_browser']!.addCommand!).mock.calls).toHaveLength(0)
})

test('if supported by browser', async () => {
    const service = new DevToolsService({
        coverageReporter: {
            enable: true
        }
    })
    service['_browser'] = browser
    await service._setupHandler()

    expect(service['_browser']?.addCommand).toBeCalledWith(
        'enablePerformanceAudits', expect.any(Function))
    expect(service['_browser']?.addCommand).toBeCalledWith(
        'disablePerformanceAudits', expect.any(Function))
    expect(service['_browser']?.addCommand).toBeCalledWith(
        'emulateDevice', expect.any(Function))
    expect(service['_browser']?.addCommand).toBeCalledWith(
        'checkPWA', expect.any(Function))
})

test('beforeCommand', async () => {
    const service = new DevToolsService({})
    service['_browser'] = browser
    await service._setupHandler()

    // @ts-ignore test without paramater
    service.beforeCommand()
    expect(service['_command'][0]._beforeCmd).toBeCalledTimes(1)
})

test('afterCommand', async () => {
    const service = new DevToolsService({})
    service['_browser'] = browser
    await service._setupHandler()

    // @ts-ignore test without paramater
    service.afterCommand()
    expect(service['_command'][0]._afterCmd).toBeCalledTimes(1)
})

test('afterCommand: switchToWindow', async () => {
    const service = new DevToolsService({})
    service['_browser'] = browser
    await service._setupHandler()

    service._setupHandler = vi.fn()
    await service.afterCommand('switchToWindow')
    expect(service._setupHandler).toBeCalledTimes(1)
    expect(service['_command'][0]._afterCmd).toBeCalledTimes(1)
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
    service['_browser'] = multiBrowser
    await service._setupHandler()
    await service._checkPWA()

    expect(service['_command'][0].checkPWA).toBeCalledTimes(1)
    expect(service['_command'][1].checkPWA).toBeCalledTimes(1)
})

test('_getCoverageReport', async () => {
    const service = new DevToolsService({})
    service['_browser'] = browser
    await service._setupHandler()

    await service._getCoverageReport()
    expect(service['_command'][0].getCoverageReport).toBeCalledTimes(1)
})

test('_getCoverageReport for multiremote', async () => {
    const service = new DevToolsService({})
    service['_browser'] = multiBrowser
    await service._setupHandler()
    await service._getCoverageReport()

    expect(service['_command'][0].getCoverageReport).toBeCalledTimes(1)
    expect(service['_command'][1].getCoverageReport).toBeCalledTimes(1)
})

test('_cdp', async () => {
    const service = new DevToolsService({})
    service['_browser'] = browser
    await service._setupHandler()

    // @ts-ignore test without paramater
    await service._cdp()
    expect(service['_command'][0].cdp).toBeCalledTimes(1)
})

test('_cdp for multiremote', async () => {
    const service = new DevToolsService({})
    service['_browser'] = multiBrowser
    await service._setupHandler()

    // @ts-ignore test without paramater
    await service._cdp()
    expect(service['_command'][0].cdp).toBeCalledTimes(1)
    expect(service['_command'][1].cdp).toBeCalledTimes(1)
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

test('after hook', async () => {
    const service = new DevToolsService({})
    service['_browser'] = browser
    await service._setupHandler()

    await service.after()
    expect(service['_command'][0]._logCoverage).toBeCalledTimes(1)
})
