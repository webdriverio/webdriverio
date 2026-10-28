import { describe, expect, it } from 'vitest'

import { botCheckNote } from '../../src/actions/botcheck.js'
import { contexts, dialogOpenError } from '../../src/actions/contexts.js'
import { exportSpec } from '../../src/actions/export.js'
import { cookieOptions } from '../../src/actions/state.js'
import { get } from '../../src/actions/query.js'
import { visual } from '../../src/actions/visual.js'
import { emulate } from '../../src/actions/emulate.js'
import { cliCmd, cmdWith } from '../../src/hints.js'
import { hintFor } from '../../src/exec/hints.js'
import type { Session } from '../../src/session.js'

const tagged = cmdWith((command) => `T:${command}`)

function fake (cmd = cliCmd) {
    return { cmd, history: { entries: [] }, name: 'default', cwd: '.', requireBidi: () => {} } as unknown as Session
}

async function hintOf (run: () => Promise<unknown> | unknown) {
    try {
        await run()
    } catch (err) {
        return (err as { hint?: string }).hint
    }
    throw new Error('did not throw')
}

describe('hint sites go through session.cmd', () => {
    it('exec hints', () => {
        expect(hintFor({ message: 'ref is not defined' })).toBe('Run `wdio session snapshot` to get fresh refs.')
        expect(hintFor({ message: 'ref is not defined' }, tagged)).toBe('Run `T:snapshot` to get fresh refs.')
        expect(hintFor({ name: 'StrictSelectorError', message: 'x' }, tagged)).toContain('Run `T:find` to locate it.')
    })

    it('bot check note', () => {
        const input = { headless: true, target: 'chrome', url: 'https://a.test/' }
        expect(botCheckNote('Cloudflare', input)).toContain('`wdio session open chrome https://a.test/ --headed --replace`')
        expect(botCheckNote('Cloudflare', input, tagged)).toContain('`T:open`')
    })

    it('dialog error', () => {
        const dialog = { type: 'prompt', message: 'x' } as Parameters<typeof dialogOpenError>[0]
        expect(dialogOpenError(dialog).hint).toBe('Run `wdio session dialog accept --text <answer>` or `wdio session dialog dismiss` first.')
        expect(dialogOpenError(dialog, tagged).hint).toBe('Run `T:dialog` or `T:dialog` first.')
    })

    it('contexts, export, get, visual, emulate, cookies', async () => {
        expect(await hintOf(() => contexts(fake(), { sub: 'switch' }))).toBe('Run `wdio session contexts` to list them.')
        expect(await hintOf(() => contexts(fake(tagged), { sub: 'switch' }))).toBe('Run `T:contexts` to list them.')
        expect(await hintOf(() => exportSpec(fake(), {}))).toBe('Drive the session first, then run `wdio session export`.')
        expect(await hintOf(() => exportSpec(fake(tagged), {}))).toBe('Drive the session first, then run `T:export`.')
        expect(await hintOf(() => get(fake(), { sub: 'count' }))).toBe('Example: wdio session get count "aria/button"')
        expect(await hintOf(() => get(fake(tagged), { sub: 'count' }))).toBe('Example: T:get')
        expect(await hintOf(() => visual(fake(), { sub: 'save' }))).toBe('Example: `wdio session visual save home`.')
        expect(await hintOf(() => visual(fake(tagged), { sub: 'save' }))).toBe('Example: `T:visual`.')
        expect(await hintOf(() => emulate(fake(), { sub: 'viewport-meta', value: 'no' }))).toBe('Run `wdio session emulate viewport-meta`.')
        expect(await hintOf(() => emulate(fake(tagged), { sub: 'viewport-meta', value: 'no' }))).toBe('Run `T:emulate`.')
        expect(await hintOf(() => cookieOptions({}))).toBe('Example: wdio session cookies set session abc')
        expect(await hintOf(() => cookieOptions({}, tagged))).toBe('Example: T:cookies')
    })
})
