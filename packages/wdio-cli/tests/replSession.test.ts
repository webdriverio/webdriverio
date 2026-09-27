import { PassThrough } from 'node:stream'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@wdio/session', () => ({
    send: vi.fn(async (_name: string, _action: string, args: { code: string }) => {
        if (args.code.includes('throw')) {
            throw new Error('boom')
        }
        return { text: `title:${args.code}` }
    })
}))

import { send } from '@wdio/session'
import { attachRepl } from '../src/replSession.js'

describe('attachRepl', () => {
    it('runs each line as exec and detaches on .exit', async () => {
        const input = new PassThrough()
        const output = new PassThrough()
        let text = ''
        output.on('data', (chunk) => { text += chunk })
        const done = attachRepl('default', { input, output })
        input.write('await browser.getTitle()\n.exit\n')
        await done
        expect(send).toHaveBeenCalledWith('default', 'exec', { code: 'await browser.getTitle()', history: false })
        expect(text).toContain('title:await browser.getTitle()')
        expect(text).toContain('Detached from "default" (still running)')
        expect(text.indexOf('title:await browser.getTitle()')).toBeLessThan(text.indexOf('Detached'))
    })
})
