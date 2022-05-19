import { describe, expect, it, vi } from 'vitest'

import ProtocolStub from '../src/protocol-stub'
import Multiremote from '../src/multiremote'

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
        expect(Object.keys(session)).toHaveLength(9)
        expect(session.isAndroid).toBe(false)
        expect(session.isChrome).toBe(false)
        expect(session.isFirefox).toBe(false)
        expect(session.isIOS).toBe(true)
        expect(session.isMobile).toBe(true)
        expect(session.isSauce).toBe(false)
        expect(session.capabilities).toEqual({
            deviceName: 'Some Device',
            platformName: 'iOS',
            foo: 'bar'
        })
        expect(() => session.addCommand()).toThrow()
        expect(() => session.overwriteCommand()).toThrow()
    })
})

describe('attachToSession', () => {
    it('should return newSession if not multiremote', async () => {
        const modifier = vi.fn()
        const session = await ProtocolStub.attachToSession({
            sessionId: '1234',
            capabilities: { browserName: 'chrome' }
        }, modifier)
        expect(modifier).not.toBeCalled()
        expect(session.isChrome).toBe(true)
    })

    it('should return newSession if modifier was not passed', async () => {
        const session = await ProtocolStub.attachToSession({ sessionId: '1234' })
        expect(session.capabilities).toEqual({})
    })

    it('should call modifier if multiremote', async () => {
        const multiremote = new Multiremote()
        // @ts-ignore test scenario
        multiremote.instances['instanceName'] = 'instance'

        const session = await ProtocolStub.attachToSession(
            // @ts-expect-error
            undefined,
            multiremote.modifier.bind(multiremote)
        )

        expect(session.capabilities).toBeUndefined()
        expect(session.commandList).toHaveLength(0)
        expect(session.instanceName).toBe('instance')
        expect(() => session.addCommand()).toThrow()
        expect(() => session.overwriteCommand()).toThrow()
    })
})
