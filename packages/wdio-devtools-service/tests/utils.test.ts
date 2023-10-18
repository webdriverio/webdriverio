import path from 'node:path'
import { describe, expect, test, vi } from 'vitest'

import { sumByKey, setUnsupportedCommand, getLighthouseDriver } from '../src/utils.js'
import type { RequestPayload } from '../src/handler/network.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('fs', () => ({
    readFileSync: vi.fn().mockReturnValue('1234\nsomepath'),
    existsSync: vi.fn()
}))

vi.mock('lighthouse/lighthouse-core/gather/connections/cri.js', () => ({
    default: class ChromeProtocol {
        public _runJsonCommand = vi.fn().mockReturnValue(['foobar'])
        public _connectToSocket = vi.fn()
        public _sendCommandMock = vi.fn()
        public on = vi.fn()

        sendCommand (...args: any) {
            this._sendCommandMock(...args)
            return { sessionId: 'session 321' }
        }
    }
}))

test('sumByKey', () => {
    expect(sumByKey([{
        size: 1
    } as unknown as RequestPayload, {
        size: 2
    } as unknown as RequestPayload, {
        size: 3
    } as unknown as RequestPayload], 'size')).toBe(6)
})

test('setUnsupportedCommand', () => {
    const browser = { addCommand: vi.fn() }
    setUnsupportedCommand(browser as unknown as WebdriverIO.Browser)
    expect(browser.addCommand).toHaveBeenCalledWith('cdp', expect.any(Function))
    const fn = browser.addCommand.mock.calls[0][1]
    expect(fn).toThrow()
})

describe('getLighthouseDriver', () => {
    test('should return a driver w/o creating new session', async () => {
        const urlMock = vi.fn().mockReturnValue('ws://127.0.0.1:56513/devtools/browser/9aae0e34-86a9-4b0e-856b-d0d37009ddbb')
        const session = {
            connection: vi.fn().mockReturnValue({ url: urlMock })
        }
        const target = { _targetId: 'foobar321' }
        const driver = await getLighthouseDriver(session as any, target as any)
        expect(session.connection).toBeCalledTimes(1)
        expect(urlMock).toBeCalledTimes(1)
        expect(driver.constructor.name).toBe('Driver')
    })

    test('should create a new session', async () => {
        const urlMock = vi.fn().mockReturnValue('ws://127.0.0.1:56513/session/9aae0e34-86a9-4b0e-856b-d0d37009ddbb/se/cdp')
        const session = {
            connection: vi.fn().mockReturnValue({ url: urlMock })
        }
        const target = { _targetId: 'foobar321' }
        const driver = await getLighthouseDriver(session as any, target as any)
        // @ts-expect-error
        driver._connection.sendCommand('foobar')
        // @ts-expect-error
        expect(driver._connection._sendCommandMock.mock.calls).toMatchSnapshot()
    })
})
