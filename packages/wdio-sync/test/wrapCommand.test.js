import { wrapCommands, wdioSync } from '../'
import Fiber from 'fibers'

const WebdriverIO = class {}
WebdriverIO.prototype = {
    getString: () => new Promise((resolve) => {
        setTimeout(() => resolve('foo'), 50)
    }),
    getInteger: (ms = 50) => new Promise((resolve) => {
        setTimeout(() => resolve(1), ms)
    }),
    getObject: (ms = 50) => new Promise((resolve) => {
        setTimeout(() => resolve({}), ms)
    }),
    getUndefined: (ms = 50) => new Promise((resolve) => {
        setTimeout(() => resolve(), ms)
    }),
    getNull: (ms = 50) => new Promise((resolve) => {
        setTimeout(() => resolve(null), ms)
    }),
    waitUntilSync: (fn) => new Promise((resolve) => {
        return wdioSync(fn, resolve)()
    })
}

const NOOP = () => {}

let instance

let run = (fn) => {
    return new Promise((resolve, reject) => {
        try {
            Fiber(() => {
                fn()
                resolve()
            }).run()
        } catch (e) {
            reject(e)
        }
    })
}

describe('wrapCommand', () => {
    beforeAll(() => {
        instance = new WebdriverIO()
        global.browser = { options: { sync: true } }
        wrapCommands(instance, NOOP, NOOP)
    })

    it('should return actual results', () => {
        return run(() => {
            expect(instance.getString()).toBe('foo')
            expect(instance.getInteger()).toBe(1)

            let result = typeof instance.getUndefined()
            expect(result).toBe('undefined')

            result = instance.getNull() === null
            expect(result).toBe()
        })
    })

    it('should not allow to chain strings, integer or falsy values', () => {
        return run(() => {
            let check = instance.getInteger().getObject === undefined
            expect(check).toBe()

            check = instance.getString().getObject === undefined
            expect(check).toBe()

            check = instance.getNull() === null
            expect(check).toBe()

            check = instance.getUndefined() === undefined
            expect(check).toBe()
        })
    })

    it('should propagate prototype for passed in function results', () => {
        return run(() => {
            expect(
                instance.waitUntilSync(() => {
                    expect(instance.getString()).toBe('foo')
                    expect(instance.getObject().getString()).toBe('foo')
                    return instance.getObject()
                }).getString()
            ).toBe('foo')
        })
    })

    afterAll(() => {
        delete global.browser
    })
})
