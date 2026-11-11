import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

import { roleTable } from '@wdio/utils'
import { collectInPage, type CollectOptions } from '../src/web.js'
import { formatSnapshot } from '../src/format.js'

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
})
