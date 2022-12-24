import { describe, expect, it, vi, beforeEach } from 'vitest'

import WDIORunner from '../src/index.js'
import type BaseReporter from '../src/reporter.js'
import type { Options, Capabilities } from '@wdio/types'

vi.mock('../src/utils', () => ({
    __esModule: true,
    initialiseInstance() {
        return {
            '$'() { },
            '$$'() { },
            sessionId: 'id',
            isBar: false,
            events: {},
            on (eventName: string, callback: Function) {
                // @ts-ignore mock feature
                this.events[eventName] = callback
            }
        }
    }
}))

const config: Options.WebdriverIO = { capabilities: {} }
const capability: Capabilities.Capabilities = { browserName: 'foo' }

describe('wdio-runner', () => {
    describe('_initSession', () => {
        let runner: WDIORunner

        beforeEach(() => {
            runner = new WDIORunner()
            runner['_reporter'] = {
                emit: vi.fn()
            } as unknown as BaseReporter
        })

        it('command event', async () => {
            const browser = await runner['_initSession'](config, capability)

            const command = { foo: 'bar' }
            // @ts-ignore mock feature
            browser.events.command(command)

            expect(command).toEqual({ foo: 'bar', sessionId: 'id' })
        })

        it('result event', async () => {
            const browser = await runner['_initSession'](config, capability)

            const result = { bar: 'foo' }
            // @ts-ignore mock feature
            browser.events.result(result)

            expect(result).toEqual({ bar: 'foo', sessionId: 'id' })
        })
    })
})
