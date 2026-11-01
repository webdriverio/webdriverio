import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { runWatchModeTest } from '../utils.js'

const directory = path.dirname(fileURLToPath(import.meta.url))

async function runReloadWatchTest(parallel) {
    const workerCount = parallel ? 2 : 1
    let source
    let watchedSpec
    let stateDirectory
    let deletionsPath

    const readStates = async () => {
        const filenames = (await fs.readdir(stateDirectory)).filter((filename) => filename.startsWith('sessions-'))
        assert.equal(filenames.length, workerCount)
        return Promise.all(filenames.map(async (filename) => JSON.parse(await fs.readFile(path.join(stateDirectory, filename), 'utf8'))))
    }

    await runWatchModeTest({
        name: parallel ? 'Parallel multi-remote watch reload' : 'Multi-remote watch reload',
        temporaryDirectoryPrefix: 'wdio-watch-reload-',
        configPath: path.join(directory, 'reload.conf.js'),
        mockService: true,
        async setup({ temporaryDirectory }) {
            stateDirectory = temporaryDirectory
            deletionsPath = path.join(temporaryDirectory, 'deletions.jsonl')
            source = await fs.readFile(path.join(directory, 'reload.test.js'), 'utf8')
            watchedSpec = path.join(temporaryDirectory, 'watch.test.mjs')
            await fs.writeFile(watchedSpec, source)
            return {
                WDIO_WATCH_SPEC: watchedSpec,
                WDIO_WATCH_PARALLEL: parallel ? '1' : '',
                WDIO_WATCH_STATE: stateDirectory,
                WDIO_WATCH_DELETIONS: deletionsPath
            }
        },
        async execute({ waitForWorkerRuns }) {
            await waitForWorkerRuns(workerCount, 1)
            for (const state of await readStates()) {
                assert.notEqual(state.current.browserA, state.original.browserA)
                assert.equal(state.current.browserB, state.original.browserB)
            }

            await fs.writeFile(watchedSpec, source.replace('passing-reload', 'passing-rerun'))
            await waitForWorkerRuns(workerCount, 2)

            // A failed run must also retain its replacement session for the next rerun.
            await fs.writeFile(watchedSpec, source.replace('passing-reload', 'failing-reload'))
            await waitForWorkerRuns(workerCount, 3, [0, 0, 1])

            await fs.writeFile(watchedSpec, source.replace('passing-reload', 'final-rerun'))
            await waitForWorkerRuns(workerCount, 4, [0, 0, 1, 0])
            for (const state of await readStates()) {
                assert.deepEqual(state.runs.map((run) => run.phase), [
                    'passing-reload', 'passing-rerun', 'failing-reload', 'final-rerun'
                ])
                assert.deepEqual(state.runs[1].before, state.runs[0].after)
                assert.deepEqual(state.runs[3].before, state.runs[2].after)
                assert.notEqual(state.runs[2].after.browserA, state.runs[0].after.browserA)
                assert.equal(state.current.browserB, state.original.browserB)
            }
        },
        async verifyShutdown() {
            const deletions = (await fs.readFile(deletionsPath, 'utf8')).trim().split('\n').map(JSON.parse)
            for (const state of await readStates()) {
                const deleted = deletions.filter((entry) => entry.cid === state.cid).map((entry) => entry.sessionId)
                assert.equal(deleted.length, 4, 'Reload and shutdown must delete each session exactly once')
                assert.deepEqual(new Set(deleted), new Set([
                    state.original.browserA,
                    state.original.browserB,
                    state.runs[0].after.browserA,
                    state.current.browserA
                ]))
            }
        }
    })
}

export default async function watchReloadMultiRemote() {
    await runReloadWatchTest(false)
}

export async function watchReloadParallelMultiRemote() {
    await runReloadWatchTest(true)
}
