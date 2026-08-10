/**
 * Tier T2 — real browser via @wdio/mcp (E2E-08..11), gated on Chrome.
 *
 * Real Chrome (launched via CDP) driven through the real @wdio/mcp stdio
 * server, scripted with a fake model. Target: a local static page served by
 * the fixture server — no external network.
 *
 * No chromedriver: launch_chrome spawns Chrome with remote debugging and
 * start_session attaches over CDP.
 *
 * Gating: live CDP probe (binary alone is not enough for display-less
 * environments — launch_chrome is not headless). Teardown: process-group
 * SIGKILL scoped to each case's own debug port, so the zygote/gpu/utility
 * children die with the browser and no other suite's Chrome is touched.
 */
import { afterEach, describe, expect, it } from 'vitest'
import path from 'node:path'
import { serveDir } from '../fixtures/server.mjs'
import {
    MCP_SERVER_JS,
    PAGE_HTML,
    buildHarness,
    chromeAvailable,
    killChromeGroup,
    makeTempDir,
    pgrepCount,
    rmrf,
    toolResultText,
} from '../helpers.js'

/** Real @wdio/mcp stdio server (not the fixture loopback). */
const REAL_MCP = { command: process.execPath, args: [MCP_SERVER_JS] }

// distinct CDP ports so a leftover Chrome from a failed run cannot satisfy
// another case's attach
const PORT = { e2e08: 9350, e2e09: 9351, e2e10: 9352, e2e11: 9353 }

function chromePattern(port: number): string {
    return `remote-debugging-port=${port}`
}

/** The real server is spawned from the monorepo path — scoped orphan check. */
const MCP_ORPHAN_PATTERN = 'packages/wdio-deepagent/node_modules/@wdio/mcp/lib/server.js'

const chromeOk = await chromeAvailable()
const describeChrome = chromeOk ? describe : describe.skip

describeChrome('T2 — real Chrome traversal surface', () => {
    afterEach(() => {
        // guarantee no orphan Chrome remains with any of our debug profiles
        for (const port of Object.values(PORT)) {
            killChromeGroup(chromePattern(port))
        }
    })

    it('E2E-08 launch + navigate + title + screenshot', async () => {
        const dir = await makeTempDir('t2-08-')
        const server = await serveDir(path.dirname(PAGE_HTML))
        const harness = await buildHarness(
            [
                [{ name: 'launch_chrome', args: { port: PORT.e2e08 }, id: 'l1' }],
                [{ name: 'start_session', args: { platform: 'browser', attach: true, attachConfig: { port: PORT.e2e08 } }, id: 's1' }],
                [{ name: 'navigate', args: { url: `${server.url}/page.html` }, id: 'n1' }],
                [{ name: 'execute_script', args: { script: 'return document.title' }, id: 't1' }],
                [{ name: 'get_screenshot', args: {}, id: 'g1' }],
                [],
            ],
            { projectRoot: dir, mcp: REAL_MCP },
        )
        try {
            const run = await harness.agent.invoke({
                messages: [{ role: 'user', content: 'load the fixture page' }],
            })
            // Chrome process alive during the run
            expect(pgrepCount(chromePattern(PORT.e2e08))).toBeGreaterThan(0)
            // title matches the fixture <title>
            expect(toolResultText(run, 't1')).toContain('Fixture Page')
            // screenshot is a non-empty base64 image
            const shot = toolResultText(run, 'g1')
            expect(Buffer.from(shot, 'base64').length).toBeGreaterThan(0)
        } finally {
            await harness.close()
            await server.close()
            await rmrf(dir)
        }
    })

    it('E2E-09 interact + assert state (click swaps the title)', async () => {
        const dir = await makeTempDir('t2-09-')
        const server = await serveDir(path.dirname(PAGE_HTML))
        const harness = await buildHarness(
            [
                [{ name: 'launch_chrome', args: { port: PORT.e2e09 }, id: 'l1' }],
                [{ name: 'start_session', args: { platform: 'browser', attach: true, attachConfig: { port: PORT.e2e09 } }, id: 's1' }],
                [{ name: 'navigate', args: { url: `${server.url}/page.html` }, id: 'n1' }],
                [{ name: 'click_element', args: { selector: '#swap' }, id: 'c1' }],
                [{ name: 'execute_script', args: { script: 'return document.title' }, id: 't1' }],
                [],
            ],
            { projectRoot: dir, mcp: REAL_MCP },
        )
        try {
            const run = await harness.agent.invoke({
                messages: [{ role: 'user', content: 'click the swap button' }],
            })
            expect(toolResultText(run, 'c1')).toContain('clicked')
            expect(toolResultText(run, 't1')).toContain('After Click')
        } finally {
            await harness.close()
            await server.close()
            await rmrf(dir)
        }
    })

    it('E2E-10 cookies + script execution', async () => {
        const dir = await makeTempDir('t2-10-')
        const server = await serveDir(path.dirname(PAGE_HTML))
        const harness = await buildHarness(
            [
                [{ name: 'launch_chrome', args: { port: PORT.e2e10 }, id: 'l1' }],
                [{ name: 'start_session', args: { platform: 'browser', attach: true, attachConfig: { port: PORT.e2e10 } }, id: 's1' }],
                [{ name: 'navigate', args: { url: `${server.url}/page.html` }, id: 'n1' }],
                [{ name: 'set_cookie', args: { name: 'session', value: 'abc123' }, id: 'k1' }],
                [{ name: 'get_cookies', args: {}, id: 'k2' }],
                [{ name: 'execute_script', args: { script: 'return document.cookie' }, id: 'k3' }],
                [],
            ],
            { projectRoot: dir, mcp: REAL_MCP },
        )
        try {
            const run = await harness.agent.invoke({
                messages: [{ role: 'user', content: 'set a cookie and read it back' }],
            })
            // cookie round-trips through get_cookies
            const cookies = toolResultText(run, 'k2')
            expect(cookies).toContain('session')
            expect(cookies).toContain('abc123')
            // and through execute_script in page context
            expect(toolResultText(run, 'k3')).toContain('session=abc123')
        } finally {
            await harness.close()
            await server.close()
            await rmrf(dir)
        }
    })

    it('E2E-11 clean shutdown: close() releases the MCP server and Chrome is cleaned up', async () => {
        const dir = await makeTempDir('t2-11-')
        const harness = await buildHarness(
            [
                [{ name: 'launch_chrome', args: { port: PORT.e2e11 }, id: 'l1' }],
                [{ name: 'start_session', args: { platform: 'browser', attach: true, attachConfig: { port: PORT.e2e11 } }, id: 's1' }],
                [],
            ],
            { projectRoot: dir, mcp: REAL_MCP },
        )
        try {
            await harness.agent.invoke({ messages: [{ role: 'user', content: 'start chrome' }] })
            expect(pgrepCount(chromePattern(PORT.e2e11))).toBeGreaterThan(0)
        } finally {
            // close() resolves without hanging (MCP child transport closes) —
            // the real server must be gone after
            await harness.close()
            expect(pgrepCount(MCP_ORPHAN_PATTERN)).toBe(0)
            // Chrome launched via CDP is detached by design (outlives the MCP
            // server) — the suite tears it down explicitly, group-kill scoped
            // to this case's port, and asserts none remain
            killChromeGroup(chromePattern(PORT.e2e11))
            expect(pgrepCount(chromePattern(PORT.e2e11))).toBe(0)
            await rmrf(dir)
        }
    })
})
