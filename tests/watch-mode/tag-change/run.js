import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { runWatchModeTest } from '../utils.js'

const directory = path.dirname(fileURLToPath(import.meta.url))
const feature = (name, tag = '') => `${tag}\nFeature: ${name}\n    Scenario: ${name}\n        Given the scenario of feature ${name} runs\n`

/**
 * a feature file without a scenario for `cucumberOpts.tags` runs once it gets the tag
 */
export default async function watchModeCucumberTags() {
    let temporaryDirectory

    await runWatchModeTest({
        name: 'Watch mode Cucumber tags',
        temporaryDirectoryPrefix: 'wdio-watch-tags-',
        configPath: path.join(directory, 'wdio.conf.js'),
        async setup(options) {
            temporaryDirectory = options.temporaryDirectory
            await fs.writeFile(path.join(temporaryDirectory, 'a.feature'), feature('a', '@wanted'))
            await fs.writeFile(path.join(temporaryDirectory, 'b.feature'), feature('b'))
            return { WDIO_WATCH_DIR: temporaryDirectory }
        },
        async execute({ waitForWorkerRuns }) {
            const ran = async () => (await fs.readFile(path.join(temporaryDirectory, 'ran.log'), 'utf8')).trim().split('\n')
            await waitForWorkerRuns(2, 1)
            assert.deepEqual(await ran(), ['a'], 'only the feature with the tag must run')

            await fs.writeFile(path.join(temporaryDirectory, 'b.feature'), feature('b', '@wanted'))
            await waitForWorkerRuns(1, 2)
            assert.deepEqual(await ran(), ['a', 'b'], 'the feature must run once it has the tag')
        }
    })
}
