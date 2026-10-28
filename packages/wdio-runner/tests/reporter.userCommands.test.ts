import path from 'node:path'
import { AsyncLocalStorage } from 'node:async_hooks'
import { describe, expect, it, vi } from 'vitest'
import { registerUserCommands, runUserCommand, setUserCommandStore } from '@wdio/utils'

import BaseReporter from '../src/reporter.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('@wdio/config', () => import(path.join(process.cwd(), '__mocks__', '@wdio/config')))

setUserCommandStore(new AsyncLocalStorage())
registerUserCommands(['getTitle'])

describe('BaseReporter user command events', () => {
    it('sends no user command event for a command that a reporter runs', async () => {
        const browser = { isBidi: true, options: {}, emit: vi.fn() }
        const getTitle = () => runUserCommand(browser, 'getTitle', [], async () => 'title')
        let pending: Promise<unknown> | undefined
        const reporter = new BaseReporter({ reporters: [] } as unknown as WebdriverIO.Config, '0-0', { browserName: 'foo' })
        reporter['_reporters'] = [{ emit: () => { pending = getTitle() } }] as any

        reporter.emit('test:end', {})
        await pending
        expect(browser.emit).not.toBeCalled()

        // the same command from the test sends its events
        await getTitle()
        expect(browser.emit).toBeCalledWith('userCommand', expect.objectContaining({ command: 'getTitle' }))
    })

    it.each([
        ['no reporter gets them', [{ showsUserCommands: false }, { showsUserCommands: false }], false],
        ['a reporter gets them', [{ showsUserCommands: false }, { showsUserCommands: true }], true],
        ['a reporter is no WDIOReporter', [{ showsUserCommands: false }, {}], true]
    ])('knows if a reporter gets user commands: %s', (_, reporters, expected) => {
        const reporter = new BaseReporter({ reporters: [] } as unknown as WebdriverIO.Config, '0-0', { browserName: 'foo' })
        reporter['_reporters'] = reporters.map((props) => ({ emit: vi.fn(), ...props })) as any
        expect(reporter.showsUserCommands).toBe(expected)
    })
})
