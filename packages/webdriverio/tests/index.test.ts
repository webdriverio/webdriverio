import path from 'node:path'
// @ts-ignore mock feature
import { logMock } from '@wdio/logger'
import * as webdriverio from '../src'

// If you're making a change here, like adding a new export, the TypeScript
// typings may need an update : packages/webdriverio/webdriverio.d.ts

const OUTPUT_DIR = path.join('some', 'output', 'dir')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'wdio.log')

const setUpLogCheck = (conditionFunction: () => boolean) => {
    const logCheck = (...args: string[]) => {
        if (!conditionFunction()) {
            throw new Error(
                'Log function was called before setting ' +
                'process.env.WDIO_LOG_PATH.\n' +
                'Passed arguments to log function:\n' +
                args.map((arg, index) => `  [${index}]: ${arg}`).join('\n')
            )
        }
    }

    logMock.error.mockImplementation(logCheck)
    logMock.warn.mockImplementation(logCheck)
    logMock.info.mockImplementation(logCheck)
    logMock.debug.mockImplementation(logCheck)
}

describe('index.js', () => {
    afterEach(() => {
        delete process.env.WDIO_LOG_PATH

        logMock.error.mockRestore()
        logMock.warn.mockRestore()
        logMock.info.mockRestore()
        logMock.debug.mockRestore()
    })

    it('exports remote method', () => {
        expect(webdriverio.remote).toBeDefined()
    })

    it('exports attach method', () => {
        expect(webdriverio.attach).toBeDefined()
    })

    it('exports multiremote method', () => {
        expect(webdriverio.multiremote).toBeDefined()
    })

    it('exports remote method', () => {
        expect(webdriverio.remote).toBeDefined()
    })

    it('exports SevereServiceError class', () => {
        expect(webdriverio.SevereServiceError).toBeDefined()
    })

    describe('remote method', () => {
        it('should be possible to skip setting outputDir', async () => {
            setUpLogCheck(() => !('WDIO_LOG_PATH' in process.env))

            await webdriverio.remote({
                capabilities: {
                    browserName: 'chrome'
                }
            })

            expect('WDIO_LOG_PATH' in process.env).toBe(false)
        })

        it('should be possible to set outputDir', async () => {
            setUpLogCheck(() => process.env.WDIO_LOG_PATH === OUTPUT_FILE)

            await webdriverio.remote({
                capabilities: {
                    browserName: 'chrome'
                },
                outputDir: OUTPUT_DIR,
            })

            expect(process.env.WDIO_LOG_PATH).toBe(OUTPUT_FILE)
        })

        it('should be possible to override outputDir with env var', async () => {
            const customPath = '/some/custom/path'

            setUpLogCheck(() => process.env.WDIO_LOG_PATH === customPath)

            process.env.WDIO_LOG_PATH = customPath

            await webdriverio.remote({
                capabilities: { browserName: 'chrome' },
                outputDir: OUTPUT_DIR,
            })

            expect(process.env.WDIO_LOG_PATH).not.toBe(OUTPUT_DIR)
            expect(process.env.WDIO_LOG_PATH).toBe(customPath)
        })
    })
})
