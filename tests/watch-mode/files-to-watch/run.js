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
            const watchedSpec = path.join(temporaryDirectory, 'watch.test.mjs')
            watchedFile = path.join(temporaryDirectory, 'watched-file.txt')
            await Promise.all([
                fs.copyFile(path.join(directory, 'watch.test.js'), watchedSpec),
                fs.writeFile(watchedFile, 'initial')
            ])
            return {
                WDIO_WATCH_SPEC: watchedSpec,
                WDIO_WATCH_FILE: watchedFile
            }
        },
        async execute({ driver, waitForRun }) {
            await waitForRun(1)
            await fs.writeFile(watchedFile, 'changed')
            await waitForRun(2)

            assert.equal(driver.created.length, 1, 'Rerunning must not create a new session')
            const [sessionId] = driver.created
            assert.deepEqual(driver.navigations, [
                { sessionId, url: 'http://watch-mode.test/files-to-watch' },
                { sessionId, url: 'http://watch-mode.test/files-to-watch' }
            ], 'Changing a filesToWatch entry must rerun the complete suite in the original session')
            assert.deepEqual(driver.titles, [sessionId, sessionId])
            assert.deepEqual(driver.deleted, [], 'The session must stay alive between runs')
        }
    })
}
