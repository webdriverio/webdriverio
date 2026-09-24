import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { runWatchModeTest } from '../utils.js'

const directory = path.dirname(fileURLToPath(import.meta.url))

export default async function watchMultiremote() {
    let source
    let watchedSpec

    await runWatchModeTest({
        name: 'Watch mode multiremote',
        temporaryDirectoryPrefix: 'wdio-watch-multiremote-',
        configPath: path.join(directory, 'wdio.conf.js'),
        expectSessionCleanup: false,
        async setup({ temporaryDirectory }) {
            source = await fs.readFile(path.join(directory, 'watch.test.js'), 'utf8')
            watchedSpec = path.join(temporaryDirectory, 'watch.test.mjs')
            await fs.writeFile(watchedSpec, source)
            return { WDIO_WATCH_SPEC: watchedSpec }
        },
        async execute({ driver, waitForRun }) {
            // Run 1: initial passing run
            await waitForRun(1)

            // Run 2: introduce a failing assertion to verify reruns after a failure.
            // Both getTitle calls happen before the assertion, so browserB also fetches
            const failingSource = source
                .replaceAll('/first', '/failing')
                .replace("assert.equal(titleA, 'Watch mode')", "assert.equal(titleA, 'Unexpected title')")
            await fs.writeFile(watchedSpec, failingSource)
            await waitForRun(2, 1)

            // Run 3: fix the spec and run it once more.
            await fs.writeFile(watchedSpec, source.replaceAll('/first', '/second'))
            await waitForRun(3)

            assert.equal(driver.created.length, 6, 'Multiremote creates two new sessions for every watch run')
            assert.equal(new Set(driver.created).size, 6, 'Every session must be distinct')

            // 3 runs × 2 browsers = 6 navigations
            assert.equal(driver.navigations.length, 6, 'Every run must execute the current spec in both browsers')
            for (const [run, url] of [
                'http://watch-mode.test/first',
                'http://watch-mode.test/failing',
                'http://watch-mode.test/second'
            ].entries()) {
                const runNavigations = driver.navigations.filter((navigation) => navigation.url === url)
                assert.equal(runNavigations.length, 2)
                assert.deepEqual(
                    new Set(runNavigations.map(({ sessionId }) => sessionId)),
                    new Set(driver.created.slice(run * 2, run * 2 + 2))
                )
            }

            // Title fetched for both browsers in every run, including the failing one:
            // 3 runs × 2 browsers = 6 title fetches
            assert.equal(driver.titles.length, 6, 'Title must be fetched for every browser in every run')
            assert.deepEqual(driver.deleted, [], 'Sessions stay open until the watch launcher shuts down')
        }
    })
}
