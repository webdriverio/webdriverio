import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { once } from 'node:events'
import { execFile, fork } from 'node:child_process'
import { promisify } from 'node:util'
import { setTimeout as sleep } from 'node:timers/promises'

import createWebDriverServer from './server.js'

const directory = path.dirname(fileURLToPath(import.meta.url))
const execFileAsync = promisify(execFile)

async function waitForExit(exit, timeout) {
    let timer
    try {
        return await Promise.race([
            exit,
            new Promise((resolve) => { timer = setTimeout(() => resolve(null), timeout) })
        ])
    } finally {
        clearTimeout(timer)
    }
}

async function stopWatchProcess(child, exit) {
    if (!child.pid) {
        return
    }

    // async-exit-hook already supports this IPC message on every platform.
    // It lets the launcher close its workers and delete the retained session.
    if (child.connected && child.exitCode === null && child.signalCode === null) {
        child.send('shutdown', () => {})
    }
    const result = await waitForExit(exit, 10_000)
    if (result) {
        return result
    }

    if (process.platform === 'win32') {
        await execFileAsync('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
            windowsHide: true,
            timeout: 5000
        })
    } else {
        try {
            process.kill(-child.pid, 'SIGKILL')
        } catch (error) {
            if (error.code !== 'ESRCH') {
                throw error
            }
        }
    }
    assert.ok(await waitForExit(exit, 5000), 'Watch process did not exit after forced shutdown')
    throw new Error('Watch process required forced shutdown')
}

export default async function watchMode() {
    const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-watch-mode-'))
    const watchedSpec = path.join(temporaryDirectory, 'watch.test.mjs')
    const driver = createWebDriverServer()
    let child
    let exit
    let output = ''

    try {
        driver.server.listen(0, '127.0.0.1')
        await once(driver.server, 'listening')
        const source = await fs.readFile(path.join(directory, 'watch.test.js'), 'utf8')
        await fs.writeFile(watchedSpec, source)

        child = fork(path.resolve(directory, '../../packages/wdio-cli/bin/wdio.js'), [
            'run', path.join(directory, 'wdio.conf.js'), '--watch'
        ], {
            cwd: path.dirname(directory),
            execArgv: [],
            silent: true,
            detached: process.platform !== 'win32',
            windowsHide: true,
            env: {
                ...process.env,
                WDIO_UNIT_TESTS: '1',
                WDIO_WATCH_PORT: String(driver.server.address().port),
                WDIO_WATCH_SPEC: watchedSpec
            }
        })

        const runs = []
        let spawnError
        let closed = false
        exit = new Promise((resolve) => child.once('close', (code, signal) => {
            closed = true
            resolve({ code, signal })
        }))
        child.on('error', (error) => { spawnError = error })
        child.on('message', (message) => {
            if (message.name === 'watch:run:end') {
                runs.push(message)
            }
        })
        child.stdout.on('data', (chunk) => { output += chunk })
        child.stderr.on('data', (chunk) => { output += chunk })

        const waitForRun = async (count) => {
            const deadline = performance.now() + 30_000
            while (runs.length < count) {
                assert.ifError(spawnError)
                assert.ok(!closed, 'Watch process exited before completing the run')
                assert.ok(performance.now() < deadline, `Timed out waiting for watch run ${count}`)
                await sleep(50)
            }
            assert.equal(runs[count - 1].exitCode, 0, `Watch run ${count} failed`)
        }

        await waitForRun(1)
        await fs.writeFile(watchedSpec, source.replace('/first', '/second'))
        await waitForRun(2)

        assert.equal(driver.created.length, 1, 'Rerunning must not create a new session')
        const [sessionId] = driver.created
        assert.deepEqual(driver.navigations, [
            { sessionId, url: 'http://watch-mode.test/first' },
            { sessionId, url: 'http://watch-mode.test/second' }
        ], 'Both runs must execute the current spec in the original session')
        assert.deepEqual(driver.titles, [sessionId, sessionId])
        assert.deepEqual(driver.deleted, [], 'The session must stay alive between runs')

        const result = await stopWatchProcess(child, exit)
        assert.deepEqual(result, { code: 0, signal: null })
        assert.deepEqual(driver.deleted, [sessionId], 'Shutdown must delete the retained session')
        assert.equal(driver.sessions.size, 0)
        assert.deepEqual(driver.unexpected, [], 'The fixture received unexpected WebDriver commands')
    } catch (error) {
        throw new Error(`Watch mode smoke test failed: ${error.message}\n${output}`, { cause: error })
    } finally {
        try {
            if (child) {
                await stopWatchProcess(child, exit)
            }
        } finally {
            driver.server.closeAllConnections()
            await new Promise((resolve) => driver.server.close(resolve))
            await fs.rm(temporaryDirectory, { recursive: true, force: true })
        }
    }
}
