import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { runWatchModeTest } from '../utils.js'

const directory = path.dirname(fileURLToPath(import.meta.url))

async function runMultiRemoteWatchTest(parallel) {
    let source
    let watchedSpec
    const workerCount = parallel ? 2 : 1

    await runWatchModeTest({
        name: parallel ? 'Parallel multi-remote watch mode' : 'Multi-remote watch mode',
        temporaryDirectoryPrefix: 'wdio-watch-multiremote-',
        configPath: path.join(directory, 'wdio.conf.js'),
        async setup({ temporaryDirectory }) {
            source = await fs.readFile(path.join(directory, 'watch.test.js'), 'utf8')
            watchedSpec = path.join(temporaryDirectory, 'watch.test.mjs')
            await fs.writeFile(watchedSpec, source)
            return {
                WDIO_WATCH_SPEC: watchedSpec,
                WDIO_WATCH_PARALLEL: parallel ? '1' : ''
            }
        },
        async execute({ driver, waitForWorkerRuns }) {
            await waitForWorkerRuns(workerCount, 1)
            const originalSessions = [...driver.created]
            assert.equal(originalSessions.length, workerCount * 2)

            await fs.writeFile(watchedSpec, source
                .replace('/first', '/failing')
                .replace("['Watch mode', 'Watch mode']", "['Unexpected title', 'Watch mode']"))
            await waitForWorkerRuns(workerCount, 2, [0, 1])

            await fs.writeFile(watchedSpec, source.replace('/first', '/second'))
            await waitForWorkerRuns(workerCount, 3, [0, 1, 0])

            assert.deepEqual(driver.created, originalSessions, 'Every rerun must reuse the original sessions')
            for (const sessionId of originalSessions) {
                assert.deepEqual(driver.navigations.filter((entry) => entry.sessionId === sessionId), [
                    { sessionId, url: 'http://watch-mode.test/first' },
                    { sessionId, url: 'http://watch-mode.test/failing' },
                    { sessionId, url: 'http://watch-mode.test/second' }
                ])
                assert.equal(driver.titles.filter((id) => id === sessionId).length, 3)
            }
            assert.deepEqual(driver.deleted, [], 'Sessions must stay alive between runs')
        }
    })
}

export default async function watchMultiRemote() {
    await runMultiRemoteWatchTest(false)
}

export async function watchParallelMultiRemote() {
    await runMultiRemoteWatchTest(true)
}
