import path from 'node:path'
import { ContentType } from 'allure-js-commons'
import { temporaryDirectory } from 'tempy'
import { clean } from './helpers/wdio-allure-helper.js'
import { events } from '../src/constants.js'
import AllureReporter from '../src/reporter.js'
import { getCid } from '../src/utils.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))

const fixtures = {
    testStats: {
        uid: '1',
        cid: '0-0',
        title: 'my test',
        duration: 0,
        _duration: 0,
        parent: '',
        type: 'scenario',
        start: new Date(),
        complete: vi.fn(),
    }
}

beforeEach(() => {
    vi.resetAllMocks()
})

describe('event listeners', () => {
    new AllureReporter({})

    const registeredEvents = [
        events.addTestInfo,
        events.startStep,
        events.endStep,
        events.runtimeMessage
    ]

    registeredEvents.forEach((eventName: any) => {
        it(`${eventName} should have listener defined`, () => {
            expect(process.listeners(eventName).length).toBeGreaterThanOrEqual(1)
        })
    })
})

describe('attachJSON', () => {
    const outputDir = temporaryDirectory()
    let reporterInstance: AllureReporter

    beforeEach(() => {
        clean(outputDir)

        reporterInstance = new AllureReporter({ outputDir })
        reporterInstance.onTestStart({
            uid: '1',
            cid: '0-0',
            title: 'my test',
            duration: 0,
            _duration: 0,
            parent: '',
            type: 'scenario',
            start: new Date(),
            complete: vi.fn(),
        })
    })

    it('writes json file for string content', () => {
        const fixture = JSON.stringify({ foo: 'bar' })
        const { messages } = reporterInstance.allureStatesByCid.get(getCid())!

        reporterInstance._attachJSON({
            name: 'foobar',
            json: fixture,
        })

        expect(messages).toContainEqual(expect.objectContaining({
            type: 'attachment_content',
            data: {
                name: 'foobar',
                content: Buffer.from(fixture, 'utf-8').toString('base64'),
                contentType: ContentType.JSON,
                encoding: 'base64'
            }
        }))
    })

    it('writes txt file for rest content types', () => {
        const fixture = { foo: 'bar' }
        const { messages } = reporterInstance.allureStatesByCid.get(getCid())!

        reporterInstance._attachJSON({
            name: 'foobar',
            json: fixture
        })

        expect(messages).toContainEqual(expect.objectContaining({
            type: 'attachment_content',
            data: {
                name: 'foobar',
                content: Buffer.from(JSON.stringify(fixture, null, 2), 'utf-8').toString('base64'),
                contentType: ContentType.JSON,
                encoding: 'base64'
            }
        }))
    })
})

describe('attachScreenshot', () => {
    const outputDir = temporaryDirectory()
    let reporterInstance: AllureReporter

    beforeEach(() => {
        clean(outputDir)
        reporterInstance = new AllureReporter({ outputDir })
        reporterInstance.onTestStart({
            uid: '1',
            cid: '0-0',
            title: 'my test',
            duration: 0,
            _duration: 0,
            parent: '',
            type: 'scenario',
            start: new Date(),
            complete: vi.fn(),
        })
    })

    it('writes content as png file', () => {
        const fixture = Buffer.from('0x1')
        const { messages } = reporterInstance.allureStatesByCid.get(getCid())!

        reporterInstance._attachScreenshot({
            name: 'foobar',
            content: fixture
        })

        expect(messages).toContainEqual(expect.objectContaining({
            type: 'attachment_content',
            data: {
                name: 'foobar',
                content: fixture.toString('base64'),
                contentType: ContentType.PNG,
                encoding: 'base64'
            }
        }))
    })
})

describe('attachLogs', () => {
    const outputDir = temporaryDirectory()
    let reporterInstance: AllureReporter

    beforeEach(() => {
        clean(outputDir)
    })

    it('doesn\'t write console logs when they\'re disabled', () => {
        reporterInstance = new AllureReporter({
            addConsoleLogs: false,
            outputDir,
        })

        reporterInstance.onTestStart(fixtures.testStats)
        process.stdout.write('hello world')
        reporterInstance._attachLogs()

        const { messages } = reporterInstance.allureStatesByCid.get(getCid())!

        expect(messages).not.toContainEqual(expect.objectContaining({
            type: 'attachment_content',
        }))
    })

    it('writes console logs as text file when they\'re enabled', () => {
        reporterInstance = new AllureReporter({
            addConsoleLogs: true,
            outputDir,
        })

        reporterInstance.onTestStart(fixtures.testStats)
        process.stdout.write('hello world')
        reporterInstance._attachLogs()

        const { messages } = reporterInstance.allureStatesByCid.get(getCid())!

        expect(messages).toContainEqual(expect.objectContaining({
            type: 'attachment_content',
            data: {
                name: 'Console Logs',
                content: Buffer.from('.........Console Logs.........\n\nhello world', 'utf8').toString('base64'),
                contentType: ContentType.TEXT,
                encoding: 'base64'
            }
        }))
    })
})
