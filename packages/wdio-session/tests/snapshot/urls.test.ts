import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

import { snapshot } from '../../src/actions/observe.js'
import { RefRegistry } from '../../src/snapshot/refs.js'
import { roleTable } from '@wdio/utils'
import { collectInPage, type CollectOptions } from '../../src/snapshot/web.js'
import { formatSnapshot } from '../../src/snapshot/format.js'
import type { Session } from '../../src/session.js'

const HTML = `<!doctype html><html><head><base href="https://example.com/docs/"><title>Docs</title></head><body>
<a href="/guide">Guide</a>
<a href="guide">Relative</a>
<a href="https://other.example/x">Other</a>
<iframe></iframe>
<button>Go</button>
</body></html>`

function collect (urls: boolean) {
    const dom = new JSDOM(HTML, { url: 'https://example.com/app', runScripts: 'dangerously' })
    const win = dom.window as unknown as Window & { __collect?: typeof collectInPage }
    const frame = win.document.querySelector('iframe') as HTMLIFrameElement
    const framed = frame.contentDocument
    framed?.open()
    framed?.write('<a href="inner">Inner</a>')
    framed?.close()
    win.WeakRef = WeakRef
    win.WeakMap = WeakMap
    const script = win.document.createElement('script')
    script.textContent = `window.__collect = (${collectInPage.toString()})`
    win.document.documentElement.appendChild(script)
    const fn = win.__collect
    if (!fn) {
        throw new Error('collector did not install')
    }
    const opts: CollectOptions = { roles: roleTable(), counter: 0, all: false, boxes: false, assignRefs: true, urls }
    return fn(opts)
}

describe('snapshot --urls', () => {
    it('adds resolved hrefs to links and leaves other nodes alone', () => {
        const withUrls = formatSnapshot(collect(true).tree)
        expect(withUrls).toContain('- link "Guide"')
        expect(withUrls).toContain('url=https://example.com/guide')
        expect(withUrls).toContain('url=https://example.com/docs/guide')
        expect(withUrls).toContain('url=https://other.example/x')
        expect(withUrls).not.toContain('url=https://example.com/inner')
        expect(withUrls).not.toMatch(/button "Go".*url=/)

        const plain = formatSnapshot(collect(false).tree)
        expect(plain).toContain('url=https://example.com/app')
        expect(plain).not.toContain('url=https://example.com/guide')
    })

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
                execute: async (_fn: unknown, args: CollectOptions) => {
                    seen = args
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
