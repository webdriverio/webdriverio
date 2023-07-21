import path from 'node:path'
import { expect, vi, describe, it, afterEach } from 'vitest'
// @ts-ignore mock feature
import { logMock } from '@wdio/logger'
import DevTools from '../src/index.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('puppeteer-core', () => import(path.join(process.cwd(), '__mocks__', 'puppeteer-core')))
vi.mock('chrome-launcher', () => import(path.join(process.cwd(), '__mocks__', 'chrome-launcher')))

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

describe('DevTools', () => {
    describe('newSession', () => {
        afterEach(() => {
            delete process.env.WDIO_LOG_PATH

            logMock.error.mockRestore()
            logMock.warn.mockRestore()
            logMock.info.mockRestore()
            logMock.debug.mockRestore()
        })

        it('should be possible to skip setting outputDir', async () => {
            setUpLogCheck(() => !('WDIO_LOG_PATH' in process.env))

            await DevTools.newSession({
                capabilities: { browserName: 'chrome' },
            })

            expect('WDIO_LOG_PATH' in process.env).toBe(false)
        })

        it('should be possible to set outputDir', async () => {
            setUpLogCheck(() => process.env.WDIO_LOG_PATH === OUTPUT_FILE)

            await DevTools.newSession({
                capabilities: { browserName: 'chrome' },
                outputDir: OUTPUT_DIR,
            })

            expect(process.env.WDIO_LOG_PATH).toBe(OUTPUT_FILE)
        })

        it('should be possible to override outputDir with env var', async () => {
            const customPath = '/some/custom/path'

            setUpLogCheck(() => process.env.WDIO_LOG_PATH === customPath)

            process.env.WDIO_LOG_PATH = customPath

            await DevTools.newSession({
                capabilities: { browserName: 'chrome' },
                outputDir: OUTPUT_DIR,
            })

            expect(process.env.WDIO_LOG_PATH).not.toBe(OUTPUT_DIR)
            expect(process.env.WDIO_LOG_PATH).toBe(customPath)
        })
    })

    describe('reloadSession', () => {
        it('should update puppeteer property', async () => {
            const client = await DevTools.newSession({
                capabilities: { browserName: 'chrome' },
            })

            // @ts-expect-error internal property
            expect(client.puppeteer).toBe(undefined)
            await DevTools.reloadSession(client)
            // @ts-expect-error internal property
            expect(client.puppeteer).not.toBe(undefined)
        })
    })
})
