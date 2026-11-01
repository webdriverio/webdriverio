import path from 'node:path'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'

import { expandsUserCommand } from '../src/nestedUserCommands.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const warn = logger('test').warn as ReturnType<typeof vi.fn>

describe('expandsUserCommand', () => {
    beforeEach(() => {
        warn.mockClear()
    })

    it.each([
        [undefined, 'waitUntil', false, true],
        [true, 'waitForDisplayed', false, true],
        [{}, 'expect.toHaveText', false, true],
        [{}, 'expect.not.toHaveText', false, true],
        [{}, 'login', true, false],
        [{ nested: { expand: ['login'] } }, 'login', true, true],
        [{}, 'click', false, false],
        [{ nested: 'none' }, 'waitUntil', false, false],
        [{ nested: 'all' }, 'click', false, true],
        [{ nested: { expand: ['getText'] } }, 'getText', false, true],
        [{ nested: { collapse: ['login'] } }, 'login', true, false],
        [{ nested: { collapse: ['waitFor*'] } }, 'waitForExist', false, false],
        [{ nested: { mode: 'none', expand: ['waitUntil'] } }, 'waitUntil', false, true],
        [{ nested: { expand: ['x'], collapse: ['x'] } }, 'x', false, false],
        [{ exclude: ['waitUntil'] }, 'waitUntil', false, false],
        // the top-level exclude has exact names
        [{ exclude: ['waitFor*'] }, 'waitForExist', false, true]
    ] as const)('%j: %s (custom %s) expands: %s', (option, command, _custom, expected) => {
        expect(expandsUserCommand(option as never, command)).toBe(expected)
    })

    it('uses the default rule and warns once for a value that is not valid', () => {
        const option = { nested: 'Default' }
        expect(expandsUserCommand(option as never, 'waitUntil')).toBe(true)
        expect(expandsUserCommand(option as never, 'click')).toBe(false)
        const list = { nested: { expand: 'x' } }
        expect(expandsUserCommand(list as never, 'x')).toBe(false)
        expect(expandsUserCommand(list as never, 'waitUntil')).toBe(true)
        expect(warn).toHaveBeenCalledTimes(2)
    })
})
