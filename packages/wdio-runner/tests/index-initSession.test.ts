import { describe, expect, it, vi, beforeEach } from 'vitest'

import WDIORunner from '../src'
import BaseReporter from '../src/reporter'
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

        it('should add user flags to browser but not overwrite', async () => {
            // @ts-ignore test scenario
            const browser = await runner['_initSession'](undefined, undefined, { isFoo: true, $: true, $$: false, isBar: true })

            expect(typeof browser!.$).toBe('function')
            expect(typeof browser!.$$).toBe('function')
            // @ts-ignore test scenario
            expect(browser.isFoo).toBe(true)
            // @ts-ignore test scenario
            expect(browser.isBar).toBe(false)
        })
    })
})
