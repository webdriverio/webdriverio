import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { runWatchModeTest } from '../utils.js'

const directory = path.dirname(fileURLToPath(import.meta.url))

export default async function watchFilesToWatch() {
    let watchedFile

    await runWatchModeTest({
        name: 'filesToWatch',
        temporaryDirectoryPrefix: 'wdio-files-to-watch-',
        configPath: path.join(directory, 'wdio.conf.js'),
        async setup({ temporaryDirectory }) {
            const watchedSpecs = [
                path.join(temporaryDirectory, 'first.test.mjs'),
                path.join(temporaryDirectory, 'second.test.mjs')
            ]
            watchedFile = path.join(temporaryDirectory, 'watched-file.txt')
            await Promise.all([
                fs.copyFile(path.join(directory, 'first.test.js'), watchedSpecs[0]),
                fs.copyFile(path.join(directory, 'second.test.js'), watchedSpecs[1]),
                fs.writeFile(watchedFile, 'initial')
            ])
            return {
                WDIO_WATCH_SPECS: JSON.stringify(watchedSpecs),
                WDIO_WATCH_FILE: watchedFile
            }
        },
        async execute({ driver, waitForWorkerRuns }) {
            // Both workers have to be idle before the file changes. A busy
            // worker is left out of the filesToWatch rerun, and two total
            // completions can both belong to the first worker.
            await waitForWorkerRuns(2, 1)
            await fs.writeFile(watchedFile, 'changed')
            await waitForWorkerRuns(2, 2)

            assert.equal(driver.created.length, 2, 'Each spec must keep its own session across the rerun')
            const sessionIds = new Set(driver.created)
            assert.equal(sessionIds.size, 2, 'The two specs must not share a session')
            assert.equal(driver.navigations.length, 4, 'Both specs must run before and after the watched file changes')
            const specSessions = new Set()
            for (const specName of ['first', 'second']) {
                const navigations = driver.navigations.filter(({ url }) => url.endsWith(`/${specName}`))
                assert.equal(navigations.length, 2, `${specName} spec must run twice`)
                const [specSession] = new Set(navigations.map((navigation) => navigation.sessionId))
                assert.equal(new Set(navigations.map((navigation) => navigation.sessionId)).size, 1, `${specName} must stay on one session`)
                assert.ok(sessionIds.has(specSession))
                specSessions.add(specSession)
            }
            assert.equal(specSessions.size, 2, 'Each spec must run in a different session')
            assert.equal(driver.titles.length, 4)
            assert.deepEqual(driver.deleted, [], 'The session must stay alive between runs')
        }
    })
}
