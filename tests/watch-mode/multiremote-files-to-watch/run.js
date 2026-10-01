import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { runWatchModeTest } from '../utils.js'

const directory = path.dirname(fileURLToPath(import.meta.url))

export default async function watchMultiremoteFilesToWatch() {
    let watchedFile

    await runWatchModeTest({
        name: 'multiremoteFilesToWatch',
        temporaryDirectoryPrefix: 'wdio-multiremote-files-to-watch-',
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
            // Both specs are grouped into one worker, so each suite run emits
            // one onWorkerEnd event.
            await waitForRun(1)

            // Modify the watched file to trigger rerun of both specs
            await fs.writeFile(watchedFile, 'changed')
            await waitForRun(2)

            assert.equal(driver.created.length, 2, 'Multiremote must not create new sessions on rerun (browserA + browserB)')
            const [sessionA, sessionB] = driver.created

            // Each spec runs twice, and each spec navigates both browsers.
            // So 2 specs * 2 runs * 2 browsers = 8 navigations total.
            assert.equal(driver.navigations.length, 8, 'Both specs must run before and after the watched file changes on both browsers')

            for (const specName of ['first', 'second']) {
                const specNavs = driver.navigations.filter(({ url }) => url.endsWith(`/${specName}`))
                assert.equal(specNavs.length, 4, `${specName} spec must run twice, navigating both browsers each time`)

                const sessionANavs = specNavs.filter(n => n.sessionId === sessionA)
                const sessionBNavs = specNavs.filter(n => n.sessionId === sessionB)
                assert.equal(sessionANavs.length, 2)
                assert.equal(sessionBNavs.length, 2)
            }

            assert.equal(driver.titles.length, 8)
            assert.deepEqual(driver.deleted, [], 'Both sessions must stay alive between runs')
        }
    })
}
