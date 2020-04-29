import { logMock } from '@wdio/logger'

import { initialiseLauncherService, initialiseWorkerService } from '../src/initialiseServices'

class CustomService {
    constructor (options, caps, config) {
        this.options = options
        this.config = config
        this.caps = caps
    }
}

beforeEach(() => {
    logMock.error.mockClear()
})

describe('initialiseLauncherService', () => {
    it('should return empty array if no services prop is given', () => {
        expect(initialiseLauncherService({ services: [] })).toEqual({
            ignoredWorkerServices: [],
            launcherServices: []
        })
    })

    it('should be able to add initialised services', () => {
        const service = {
            before: jest.fn(),
            afterTest: jest.fn()
        }

        const {
            launcherServices,
            ignoredWorkerServices
        } = initialiseLauncherService({ services: [service] })
        expect(ignoredWorkerServices).toHaveLength(0)
        expect(launcherServices).toHaveLength(1)
        expect(launcherServices[0]).toEqual(service)
    })

    it('should allow custom services without options', () => {
        const {
            launcherServices,
            ignoredWorkerServices
        } = initialiseLauncherService(
            { services: [CustomService], foo: 'bar' },
            ['./spec.js']
        )
        expect(ignoredWorkerServices).toHaveLength(0)
        expect(launcherServices).toHaveLength(1)
        expect(launcherServices[0].config.foo).toBe('bar')
    })

    it('should allow custom services with options', () => {
        const {
            launcherServices,
            ignoredWorkerServices
        } = initialiseLauncherService(
            { services: [[CustomService, { foo: 'foo' }]], foo: 'bar' },
            ['./spec.js']
        )
        expect(ignoredWorkerServices).toHaveLength(0)
        expect(launcherServices).toHaveLength(1)
        expect(launcherServices[0].options.foo).toBe('foo')
        expect(launcherServices[0].config.foo).toBe('bar')
    })

    it('should allow custom services with empty options', () => {
        const { launcherServices } = initialiseLauncherService(
            { services: [[CustomService]], foo: 'bar' },
            ['./spec.js']
        )
        expect(launcherServices).toHaveLength(1)
        expect(launcherServices[0].config.foo).toBe('bar')
        expect(launcherServices[0].options).toEqual({})
    })

    it('should propagate services that have launcher only capabilities', () => {
        const {
            launcherServices,
            ignoredWorkerServices
        } = initialiseLauncherService({ services: ['launcher-only'] })
        expect(launcherServices).toHaveLength(1)
        expect(launcherServices[0].isLauncher).toBe(true)
        expect(ignoredWorkerServices).toEqual(['launcher-only'])
    })

    it('should ignore worker services', () => {
        const {
            launcherServices,
            ignoredWorkerServices
        } = initialiseLauncherService({ services: ['scoped'] })
        expect(launcherServices).toHaveLength(0)
        expect(ignoredWorkerServices).toHaveLength(0)
    })

    it('should not fail if service is borked', () => {
        const {
            launcherServices,
            ignoredWorkerServices
        } = initialiseLauncherService({ services: ['borked'] })
        expect(launcherServices).toHaveLength(0)
        expect(ignoredWorkerServices).toHaveLength(0)
        expect(logMock.error).toHaveBeenCalledTimes(1)
    })
})

describe('initialiseWorkerService', () => {
    it('should return empty array if no services prop is given', () => {
        expect(initialiseWorkerService({ services: [] })).toEqual([])
    })

    it('should be able to add initialised services', () => {
        const service = {
            before: jest.fn(),
            afterTest: jest.fn()
        }

        const services = initialiseWorkerService({ services: [service] })
        expect(services).toHaveLength(1)
        expect(services[0]).toEqual(service)
    })

    it('should allow custom services without options', () => {
        const services = initialiseWorkerService(
            { services: [CustomService], foo: 'bar' },
            ['./spec.js']
        )
        expect(services).toHaveLength(1)
        expect(services[0].config.foo).toBe('bar')
    })

    it('should allow custom services with options', () => {
        const services = initialiseWorkerService(
            { services: [[CustomService, { foo: 'foo' }]], foo: 'bar' },
            ['./spec.js']
        )
        expect(services).toHaveLength(1)
        expect(services[0].options.foo).toBe('foo')
        expect(services[0].config.foo).toBe('bar')
    })

    it('should allow custom services with empty options', () => {
        const services = initialiseWorkerService(
            { services: [[CustomService]], foo: 'bar' },
            ['./spec.js']
        )
        expect(services).toHaveLength(1)
        expect(services[0].config.foo).toBe('bar')
    })

    it('should ignore service with launcher only', () => {
        const services = initialiseWorkerService({ services: ['launcher-only'] })
        expect(services).toHaveLength(0)
        expect(logMock.error).toHaveBeenCalledTimes(0)
    })

    it('should not fail if service is borked', () => {
        const services = initialiseWorkerService({ services: ['borked'] })
        expect(services).toHaveLength(0)
        expect(logMock.error).toHaveBeenCalledTimes(1)
    })
})
