import { describe, expect, it, vi } from 'vitest'

import ProtocolStub from '../src/protocol-stub.js'
import Multiremote from '../src/multiremote.js'

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
        expect(Object.keys(session)).toHaveLength(16)
        expect(session.isAndroid).toBe(false)
        expect(session.isChrome).toBe(false)
        expect(session.isChromium).toBe(false)
        expect(session.isFirefox).toBe(false)
        expect(session.isIOS).toBe(true)
        expect(session.isMobile).toBe(true)
        expect(session.isSauce).toBe(false)
        expect(session.isBidi).toBe(false)
        expect(session.capabilities).toEqual({
            deviceName: 'Some Device',
            platformName: 'iOS',
            foo: 'bar'
        })
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
