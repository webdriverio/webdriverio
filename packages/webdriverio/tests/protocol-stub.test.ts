import { describe, expect, it, vi } from 'vitest'

import ProtocolStub from '../src/protocol-stub.js'
import MultiRemote from '../src/multiremote.js'

describe('reloadSession', () => {
    it('should throw', () => {
        expect(() => ProtocolStub.reloadSession()).toThrow()
    })
})

describe('newSession', () => {
    it('should add commands and flags', async () => {
        const session = await ProtocolStub.newSession({
            capabilities: {
                'appium:deviceName': 'Some Device',
                platformName: 'iOS',
                // @ts-ignore not allowed but possible
                foo: 'bar'
            }
        })
        expect(Object.keys(session)).toHaveLength(21)
        expect(session.isAndroid).toBe(false)
        expect(session.isChrome).toBe(false)
        expect(session.isChromium).toBe(false)
        expect(session.isFirefox).toBe(false)
        expect(session.isIOS).toBe(true)
        expect(session.isMobile).toBe(true)
        expect(session.isSauce).toBe(false)
        expect(session.isBidi).toBe(false)
        expect(session.isWindowsApp).toBe(false)
        expect(session.isMacApp).toBe(false)
        expect(session.capabilities).toEqual({
            deviceName: 'Some Device',
            platformName: 'iOS',
            foo: 'bar'
        })
    })
})

describe('recording custom commands', () => {
    const newSession = () => ProtocolStub.newSession({ capabilities: { browserName: 'chrome' } })
    const recorded = (session: WebdriverIO.Browser) =>
        (session as unknown as { customCommands: unknown[] }).customCommands

    it('records the options object as given', async () => {
        const session = await newSession()
        const fn = () => {}
        const options = { attachToElement: true, disableElementImplicitWait: true }

        session.addCommand('myCommand', fn, options)

        expect(recorded(session)).toEqual([['myCommand', fn, options]])
    })

    it('rejects the removed positional boolean form', async () => {
        const session = await newSession()
        const fn = () => {}

        expect(() => {
            // @ts-expect-error removed positional signature
            session.addCommand('myCommand', fn, true)
        }).toThrow('Passing a boolean as the third argument to `addCommand` was removed in WebdriverIO v10.')

        expect(() => {
            // @ts-expect-error removed positional signature
            session.overwriteCommand('click', fn, false)
        }).toThrow('Passing a boolean as the third argument to `overwriteCommand` was removed in WebdriverIO v10.')
    })

    it('records an options object even when only a name and a function are given', async () => {
        const session = await newSession()
        const fn = () => {}

        session.addCommand('myCommand', fn)

        const [command] = recorded(session) as [[string, unknown, unknown]]
        expect(command).toHaveLength(3)
        expect(command[0]).toBe('myCommand')
        expect(command[1]).toBe(fn)
        expect(typeof command[2]).toBe('object')
    })
})

describe('attachToSession', () => {
    it('should throw if not multiremote', async () => {
        const modifier = vi.fn()
        expect(() => ProtocolStub.attachToSession({
            sessionId: '1234',
            capabilities: { browserName: 'chrome' }
        } as never, modifier)).toThrow()
        expect(modifier).not.toBeCalled()
    })

    it('should return newSession if modifier was not passed', async () => {
        expect(() => ProtocolStub.attachToSession({ sessionId: '1234' } as never))
            .toThrow()
    })

    it('should call modifier if multiremote', async () => {
        const multiremote = new MultiRemote()
        multiremote.instances.set('instanceName', 'instance' as unknown as WebdriverIO.Browser)

        const session = await ProtocolStub.attachToSession(
            // @ts-expect-error
            undefined,
            multiremote.modifier.bind(multiremote)
        )

        expect(session.capabilities).toBeUndefined()
        expect(session.commandList).toHaveLength(0)
        expect(session.instances).toEqual(['instanceName'])
        expect(session.getInstance('instanceName')).toBe('instance')
        expect(Object.hasOwn(session, 'instanceName')).toBe(false)
        expect(() => session.addCommand()).toThrow()
        expect(() => session.overwriteCommand()).toThrow()
    })
})
