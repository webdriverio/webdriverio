import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { snapshot } from '../../src/actions/observe.js'
import { RefRegistry } from '@wdio/snapshot'
import type { SnapshotNode } from '@wdio/snapshot'
import type { Session } from '../../src/session.js'

const tree: SnapshotNode = {
    role: 'document',
    name: 'Shop',
    url: 'http://localhost/',
    children: [
        { role: 'generic', children: [{ role: 'status' }] },
        { role: 'button', name: 'Add', ref: 'e1', interactive: true }
    ]
}

function session () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-compact-'))
    return {
        dir,
        isWeb: true,
        applies: ['W'],
        currentUrl: async () => 'https://shop.test/',
        refs: new RefRegistry(),
        timestamp: () => 't',
        artifact: (...segments: string[]) => {
            const file = path.join(dir, ...segments)
            fs.mkdirSync(path.dirname(file), { recursive: true })
            return file
        },
        browser: {
            execute: async () => ({ tree, counter: 1, refs: [] })
        }
    } as unknown as Session & { dir: string }
}

describe('snapshot --compact', () => {
    it('omits unnamed empty nodes from the printed tree', async () => {
        const s = session()
        try {
            const full = await snapshot(s, { $cwd: '/' })
            expect(full.text).toContain('- status')
            const compact = await snapshot(s, { compact: true, $cwd: '/' })
            expect(compact.text).toBe([
                '- document "Shop" url=http://localhost/',
                '  - button "Add" [ref=e1]'
            ].join('\n'))
            expect(compact.text).not.toContain('status')
            expect(compact.text).not.toContain('generic')
        } finally {
            fs.rmSync(s.dir, { recursive: true, force: true })
        }
    })
})
