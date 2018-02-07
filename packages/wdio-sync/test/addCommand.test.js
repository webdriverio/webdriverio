import { wrapCommands } from '../src'
import Fiber from 'fibers'

const WebdriverIO = class {}
const prototype = {
    getString: () => new Promise((resolve) => {
        setTimeout(() => resolve('foo'), 50)
    }),
    getPrototype: function () {
        return prototype
    }
}

WebdriverIO.prototype = prototype

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

describe('addCommand', () => {
    beforeAll(() => {
        instance = new WebdriverIO()
        global.browser = { options: { sync: true } }
        wrapCommands(instance, NOOP, NOOP)
    })

    it('should add new commands', () => {
        return run(() => {
            instance.addCommand('getInteger', () => new Promise((resolve) => {
                setTimeout(() => resolve(1), 50)
            }))
            instance.getInteger().should.be.equal(1)
        })
    })

    it('should override existing commands', () => {
        return run(() => {
            instance.addCommand('getString', () => new Promise((resolve) => {
                setTimeout(() => resolve('bar'), 50)
            }), true)
            instance.getString().should.be.equal('bar')
        })
    })

    afterAll(() => {
        delete global.browser
    })
})
