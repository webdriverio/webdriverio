import { logMock } from '@wdio/logger'

import initialiseServices from '../src/initialiseServices'

class CustomService {
    constructor (config, caps) {
        this.config = config
        this.caps = caps
    }
}

describe('initialiseServices', () => {
    it('should return empty array if no services prop is given', () => {
        expect(initialiseServices({})).toHaveLength(0)
    })

    it('should be able to add initialised services', () => {
        const service = {
            before: jest.fn(),
            afterTest: jest.fn()
        }

        const services = initialiseServices({ services: [service] })
        expect(services).toHaveLength(1)
        expect(services[0].before).toBeTruthy()
        expect(services[0].afterTest).toBeTruthy()
    })

    it('should allow custom services without options', () => {
        const services = initialiseServices(
            { services: [CustomService], foo: 'bar' },
            ['./spec.js']
        )
        expect(services).toHaveLength(1)
        expect(services[0].config.foo).toBe('bar')
    })

    it('should allow custom services with options', () => {
        const services = initialiseServices(
            { services: [[CustomService, { foo: 'foo' }]], foo: 'bar' },
            ['./spec.js']
        )
        expect(services).toHaveLength(1)
        expect(services[0].config.foo).toBe('foo')
    })

    it('should allow custom services with empty options', () => {
        const services = initialiseServices(
            { services: [[CustomService]], foo: 'bar' },
            ['./spec.js']
        )
        expect(services).toHaveLength(1)
        expect(services[0].config.foo).toBe('bar')
    })

    it('should ignore service with launcher only', () => {
        const services = initialiseServices({ services: ['launcher-only'] })
        expect(services).toHaveLength(0)
        expect(logMock.error).toHaveBeenCalledTimes(0)
    })

    it('should not ignore service with launcher if type is given', () => {
        const services = initialiseServices({ services: ['launcher-only'] }, {}, 'launcher')
        expect(services).toHaveLength(1)
        expect(services[0].isLauncher).toBe(true)
    })

    it('should not fail if service is borked', () => {
        const services = initialiseServices({ services: ['borked'] })
        expect(services).toHaveLength(0)
        expect(logMock.error).toHaveBeenCalledTimes(1)
    })
})
