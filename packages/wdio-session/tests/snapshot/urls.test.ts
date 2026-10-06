import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { snapshot } from '../../src/actions/observe.js'
import { RefRegistry, type CollectOptions } from '@wdio/snapshot'
import type { Session } from '../../src/session.js'

describe('snapshot --urls', () => {
    it('passes urls through to the in-page collector', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-urls-'))
        let seen: CollectOptions | undefined
        const session = {
            isWeb: true,
            applies: ['W'],
            refs: new RefRegistry(),
            timestamp: () => 't',
            artifact: (...segments: string[]) => {
                const file = path.join(dir, ...segments)
                fs.mkdirSync(path.dirname(file), { recursive: true })
                return file
            },
            browser: {
                execute: async (_script: unknown, json: string) => {
                    seen = JSON.parse(json) as CollectOptions
                    return { tree: { role: 'document', name: 'Docs', url: 'https://example.com/docs', children: [] }, counter: 0, refs: [] }
                }
            }
        } as unknown as Session
        try {
            await snapshot(session, { urls: true, $cwd: '/' })
            expect(seen?.urls).toBe(true)
        } finally {
            fs.rmSync(dir, { recursive: true, force: true })
        }
    })
})
