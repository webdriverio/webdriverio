import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { runWatchModeTest } from './utils.js'

const directory = path.dirname(fileURLToPath(import.meta.url))

export default async function watchMode() {
    let source
    let watchedSpec

    await runWatchModeTest({
        name: 'Watch mode',
        temporaryDirectoryPrefix: 'wdio-watch-mode-',
        configPath: path.join(directory, 'wdio.conf.js'),
        async setup({ temporaryDirectory }) {
            source = await fs.readFile(path.join(directory, 'watch.test.js'), 'utf8')
            watchedSpec = path.join(temporaryDirectory, 'watch.test.mjs')
            await fs.writeFile(watchedSpec, source)
            return { WDIO_WATCH_SPEC: watchedSpec }
        },
        async execute({ driver, waitForRun }) {
            await waitForRun(1)
            const failingSource = source
                .replace('/first', '/failing')
                .replace("assert.equal(await browser.getTitle(), 'Watch mode')", "assert.equal(await browser.getTitle(), 'Unexpected title')")
            await fs.writeFile(watchedSpec, failingSource)
            await waitForRun(2, 1)

            await fs.writeFile(watchedSpec, source.replace('/first', '/second'))
            await waitForRun(3)

            assert.equal(driver.created.length, 1, 'Rerunning must not create a new session')
            const [sessionId] = driver.created
            assert.deepEqual(driver.navigations, [
                { sessionId, url: 'http://watch-mode.test/first' },
                { sessionId, url: 'http://watch-mode.test/failing' },
                { sessionId, url: 'http://watch-mode.test/second' }
            ], 'Every run must execute the current spec in the original session')
            assert.deepEqual(driver.titles, [sessionId, sessionId, sessionId])
            assert.deepEqual(driver.deleted, [], 'The session must stay alive between runs')
        }
    })
}
