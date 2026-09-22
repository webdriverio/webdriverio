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
        async execute({ driver, waitForRun }) {
            await waitForRun(1)
            await fs.writeFile(watchedFile, 'changed')
            await waitForRun(2)

            assert.equal(driver.created.length, 1, 'Rerunning must not create a new session')
            const [sessionId] = driver.created
            assert.equal(driver.navigations.length, 4, 'Both specs must run before and after the watched file changes')
            for (const specName of ['first', 'second']) {
                const navigations = driver.navigations.filter(({ url }) => url.endsWith(`/${specName}`))
                assert.equal(navigations.length, 2, `${specName} spec must run twice`)
                assert.ok(navigations.every((navigation) => navigation.sessionId === sessionId))
            }
            assert.equal(driver.titles.length, 4)
            assert.deepEqual(driver.deleted, [], 'The session must stay alive between runs')
        }
    })
}
