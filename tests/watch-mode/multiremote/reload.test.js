import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'

const phase = 'passing-reload'

describe('multi-remote watch reload', () => {
    it('attaches to replacement sessions on every rerun', async () => {
        const cid = process.env.WDIO_WORKER_ID
        const statePath = path.join(process.env.WDIO_WATCH_STATE, `sessions-${cid}.json`)
        const sessionIds = () => Object.fromEntries(browser.instances.map((name) => [name, browser.getInstance(name).sessionId]))
        const before = sessionIds()
        let state
        if (phase === 'passing-reload') {
            state = { cid, original: before, current: before, runs: [] }
        } else {
            state = JSON.parse(await fs.readFile(statePath, 'utf8'))
            assert.deepEqual(before, state.current, 'A watch rerun must attach to the retained replacement sessions')
        }

        if (phase.endsWith('-reload')) {
            await browser.getInstance('browserA').reloadSession()
            assert.notEqual(browser.getInstance('browserA').sessionId, before.browserA)
        }

        const after = sessionIds()
        assert.equal(after.browserB, state.original.browserB, 'The other browser must keep its original session')
        state.current = after
        state.runs.push({ phase, before, after })
        await fs.writeFile(statePath, JSON.stringify(state))

        const titles = await browser.getTitle()
        assert.deepEqual(titles, phase === 'failing-reload'
            ? ['Unexpected title', 'Mock Page Title']
            : ['Mock Page Title', 'Mock Page Title'])
    })
})
