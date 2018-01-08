import { initialisePlugin } from '../src/utils'

describe('initialisePlugin', () => {
    it('should allow to load a service plugin', () => {
        const Service = initialisePlugin('test', 'service')
        const service = new Service()
        expect(service.foo).toBe('bar')
    })

    it('should allow to load scoped services', () => {
        const Service = initialisePlugin('@saucelabs/wdio-foobar-reporter', 'reporter')
        const service = new Service()
        expect(service.foo).toBe('barfoo')
    })

    it('should throw meaningful error message', () => {
        expect(() => initialisePlugin('lala', 'service')).toThrow(/You need to install/)
        expect(() => initialisePlugin('borked', 'framework')).toThrow(/Error: foobar/)
    })
})
