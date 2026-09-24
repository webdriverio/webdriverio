import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { runWatchModeTest } from '../utils.js'

const directory = path.dirname(fileURLToPath(import.meta.url))

export default async function watchParallelMultiremote() {
    let source
    let watchedSpec

    await runWatchModeTest({
        name: 'Watch mode parallel multiremote',
        temporaryDirectoryPrefix: 'wdio-watch-parallel-multiremote-',
        configPath: path.join(directory, 'wdio.conf.js'),
        expectSessionCleanup: false,
        async setup({ temporaryDirectory }) {
            source = await fs.readFile(path.join(directory, 'watch.test.js'), 'utf8')
            watchedSpec = path.join(temporaryDirectory, 'watch.test.mjs')
            await fs.writeFile(watchedSpec, source)
            return { WDIO_WATCH_SPEC: watchedSpec }
        },
        async execute({ driver, waitForRun }) {
            // Run 1: initial passing run for 2 workers
            await waitForRun(2)

            // Run 2: introduce a failing assertion
            const failingSource = source
                .replaceAll('/first', '/failing')
                .replace("assert.equal(titleFirst, 'Watch mode')", "assert.equal(titleFirst, 'Unexpected title')")
            await fs.writeFile(watchedSpec, failingSource)
            // In parallel multiremote both workers must report the failed run.
            await waitForRun(3, 1)
            await waitForRun(4, 1)

            // Run 3: fix the spec and run it once more.
            await fs.writeFile(watchedSpec, source.replaceAll('/first', '/second'))

            await waitForRun(5)
            await waitForRun(6)

            assert.equal(driver.created.length, 12, 'Parallel multiremote creates four new sessions for every watch run')
            assert.equal(new Set(driver.created).size, 12, 'Every session must be distinct')

            // 3 runs × 4 browsers = 12 navigations
            assert.equal(driver.navigations.length, 12, 'Every run must execute the current spec in all browsers')
            const expectedUrls = ['http://watch-mode.test/first', 'http://watch-mode.test/failing', 'http://watch-mode.test/second']

            const sessionsByRun = expectedUrls.map((url) => {
                const runNavs = driver.navigations.filter(n => n.url === url)
                assert.equal(runNavs.length, 4)
                return new Set(runNavs.map(({ sessionId }) => sessionId))
            })
            assert.equal(new Set(sessionsByRun.flatMap((sessions) => [...sessions])).size, 12)

            // Title fetched for all 4 browsers in every run:
            // 3 runs × 4 browsers = 12 title fetches
            assert.equal(driver.titles.length, 12, 'Title must be fetched for every browser in every run')
            assert.deepEqual(driver.deleted, [], 'Sessions stay open until the watch launcher shuts down')
        }
    })
}
