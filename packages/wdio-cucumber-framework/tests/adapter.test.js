import path from 'path'
import CucumberAdapterFactory  from '../src'
import { NOOP } from '../src/constants'

process.send(NOOP)

const conf = {
    cucumberOpts: {
        compiler: [],
        require: [path.join(__dirname, '/fixtures/es6-definition.js')]
    }
}

const feature = [path.join(__dirname, '/fixtures/es6.feature')]

global.browser = {
    config: {},
    options: {},
    capabilities: {
        device: '',
        os: 'OS X',
        os_version: 'Sierra',
        browserName: 'chrome'
    }
}

const wdioReporter = {
    write: jest.fn(),
    emit: jest.fn(),
    on: jest.fn()
}

describe('adapter',  () => {
    it('comes with a factory', async () => {
        expect(typeof CucumberAdapterFactory.run).toBe('function')
    })

    describe('should use the compiler as defined in the options', () => {

        it('should throw an error when no compiler is defined', async () => {
            await expect(CucumberAdapterFactory.run(0, conf, feature, {}, wdioReporter))
                .rejects.toThrow('A compiler must be defined')
        })

        it('should run if the compiler is defined', async () => {
            conf.cucumberOpts.compiler.push('js:@babel/register')

            await expect(CucumberAdapterFactory.run(0, conf, feature, {}, wdioReporter))
                .resolves.toBe(0)
        }, 10000)
    })
})
