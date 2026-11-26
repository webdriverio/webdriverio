import { PassThrough } from 'node:stream'
import { describe, expect, it } from 'vitest'

import type { ActionSpec } from '../../src/actions/specs.js'
import { buildParser, hasAction, pickArgs, runSessionCli } from '../../src/cli/command.js'

async function parse (args: string[]) {
    let selected: { spec: ActionSpec, argv: Record<string, unknown> } | undefined
    let error: Error | undefined
    try {
        await buildParser((spec, argv) => {
            selected = { spec, argv }
        }).parseAsync(args, {}, (err: Error | undefined) => {
            error = err || undefined
        })
    } catch (err) {
        error = err as Error
    }
    return {
        spec: selected?.spec,
        argv: selected?.argv,
        args: selected ? pickArgs(selected.spec, selected.argv) : undefined,
        error
    }
}

function capture () {
    const stream = new PassThrough() as unknown as NodeJS.WriteStream & PassThrough
    let text = ''
    stream.on('data', (chunk) => {
        text += chunk
    })
    return { stream, text: () => text }
}

describe('buildParser and pickArgs dash handling', () => {
    it.each([
        [['fill', 'e3', '-'], 'fill', { target: 'e3', text: '-' }],
        [['fill', 'e3', 'hello', '-'], 'fill', { target: 'e3', text: 'hello -' }],
        [['fill', 'e3', '--', '-x'], 'fill', { target: 'e3', text: '-x' }],
        [['fill', 'e3', '--', '--password'], 'fill', { target: 'e3', text: '--password' }],
        [['fill', 'e3', '--', '-x', '-y'], 'fill', { target: 'e3', text: '-x -y' }],
        [['fill', 'e3', 'hello', '--', '-x'], 'fill', { target: 'e3', text: 'hello -x' }],
        [['fill', 'e3', '--', '-'], 'fill', { target: 'e3', text: '-' }],
        [['fill', 'e3', '--', '--'], 'fill', { target: 'e3', text: '--' }],
        [['fill', '--', 'e3', '-x'], 'fill', { target: 'e3', text: '-x' }],
        [['fill', 'e3', '--', '--help'], 'fill', { target: 'e3', text: '--help' }],
        [['fill', 'e3', '--', '--json'], 'fill', { target: 'e3', text: '--json' }],
        [['type', '-'], 'type', { text: '-' }],
        [['type', '--', '-x'], 'type', { text: '-x' }],
        [['type', 'e3', '-'], 'type', { text: 'e3 -' }],
        [['type', 'e3', '--', '-x', '--flag'], 'type', { text: 'e3 -x --flag' }],
        [['find', '-'], 'find', { text: '-' }],
        [['find', '--', '-x'], 'find', { text: '-x' }],
        [['press', '-'], 'press', { keys: '-' }],
        [['press', '--', '-'], 'press', { keys: '-' }],
        [['select', 'e6', '-'], 'select', { target: 'e6', value: '-' }],
        [['select', 'e6', '--by', 'value', '--', '-1'], 'select', { target: 'e6', by: 'value', value: '-1' }],
        [['cookies', 'set', 'token', '-'], 'cookies', { sub: 'set', name: 'token', value: '-' }],
        [['cookies', 'set', 'token', '--', '-abc'], 'cookies', { sub: 'set', name: 'token', value: '-abc' }],
        [['storage', 'set', 'key', '--', '--val'], 'storage', { sub: 'set', key: 'key', value: '--val' }],
        [['background', '-1'], 'background', { seconds: '-1' }],
        [['background', '--', '-1'], 'background', { seconds: '-1' }],
        [['geolocation', '-33.8688', '-70.6693'], 'geolocation', { lat: '-33.8688', lon: '-70.6693' }],
        [['geolocation', '--', '-33.8688', '-70.6693'], 'geolocation', { lat: '-33.8688', lon: '-70.6693' }],
        [['wait', '--text', '-'], 'wait', { text: '-' }],
        [['swipe', '--', 'up'], 'swipe', { direction: 'up' }]
    ])('parses %j as %s %j', async (cliArgs, expectedAction, expectedArgs) => {
        const res = await parse(cliArgs)
        expect(res.error).toBeUndefined()
        expect(res.spec?.name).toBe(expectedAction)
        expect(res.args).toEqual(expectedArgs)
    })

    it('keeps flags before -- active while treating flags after -- as literal text', async () => {
        const res = await parse(['fill', '-s', 'shop', 'e3', '--', '-x', '--session', 'other', '--json'])
        expect(res.error).toBeUndefined()
        expect(res.argv?.session).toBe('shop')
        expect(res.argv?.json).toBeUndefined()
        expect(res.args).toEqual({ target: 'e3', text: '-x --session other --json' })
    })

    it('works when parseAsync is called without a callback', async () => {
        const collected: Record<string, unknown>[] = []
        for (const cliArgs of [['fill', 'e3', '-'], ['fill', 'e3', '--', '-x'], ['type', '-']]) {
            await buildParser((spec, argv) => {
                collected.push(pickArgs(spec, argv))
            }).parseAsync(cliArgs)
        }
        expect(collected).toEqual([
            { target: 'e3', text: '-' },
            { target: 'e3', text: '-x' },
            { text: '-' }
        ])
    })

    it('still enforces required arguments, strict flags, and choices', async () => {
        const missingFill = await parse(['fill', 'e3', '--'])
        expect(missingFill.error?.message).toContain('Not enough non-option arguments')

        const missingType = await parse(['type', '--'])
        expect(missingType.error?.message).toContain('Not enough non-option arguments')

        const unknownFlag = await parse(['fill', 'e3', 'hello', '--bogus'])
        expect(unknownFlag.error?.message).toContain('Unknown argument: bogus')

        const badChoice = await parse(['swipe', '--', '-x'])
        expect(badChoice.error?.message).toContain('"-x"')
        expect(badChoice.error?.message).not.toContain('__wdio_lit_')
    })

    it('detects actions correctly around -- in hasAction', () => {
        expect(hasAction(['fill', 'e3', '--', '-x'])).toBe(true)
        expect(hasAction(['--', 'fill', 'e3'])).toBe(true)
        expect(hasAction(['--'])).toBe(false)
        expect(hasAction(['-s', 'shop'])).toBe(false)
    })

    it('does not treat --json after -- as a global JSON flag on parse errors', async () => {
        const stdout = capture()
        const stderr = capture()
        const code = await runSessionCli(['fill', '--', '--json'], {
            stdout: stdout.stream,
            stderr: stderr.stream,
            env: { WDIO_SESSION_DIR: '/nonexistent-wdio-session-dir' }
        })
        expect(code).toBe(2)
        expect(stdout.text()).toBe('')
        expect(stderr.text()).toContain('Not enough non-option arguments')
    })
})
