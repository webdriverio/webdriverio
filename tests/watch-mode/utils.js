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

async function removeTemporaryDirectory(temporaryDirectory, prefix) {
    const resolvedTemporaryDirectory = path.resolve(temporaryDirectory)
    const directoryName = path.basename(resolvedTemporaryDirectory)
    assert.equal(
        path.dirname(resolvedTemporaryDirectory),
        path.resolve(os.tmpdir()),
        `Refusing to remove a directory outside the system temp directory: ${resolvedTemporaryDirectory}`
    )
    assert.ok(
        directoryName.startsWith(prefix) && directoryName.length > prefix.length,
        `Refusing to remove an unexpected temp directory: ${resolvedTemporaryDirectory}`
    )
    await fs.rm(resolvedTemporaryDirectory, { recursive: true, force: true })
}

export async function runWatchModeTest({
    name,
    temporaryDirectoryPrefix,
    configPath,
    setup,
    execute,
    expectSessionCleanup = true
}) {
    const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), temporaryDirectoryPrefix))
    const driver = createWebDriverServer()
    let child
    let exit
    let output = ''

    try {
        driver.server.listen(0, '127.0.0.1')
        await once(driver.server, 'listening')
        const env = await setup({ temporaryDirectory })

        child = fork(path.resolve(directory, '../../packages/wdio-cli/bin/wdio.js'), [
            'run', configPath, '--watch'
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
                ...env
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

        const waitForRun = async (count, expectedExitCode = 0) => {
            const deadline = performance.now() + 30_000
            while (runs.length < count) {
                assert.ifError(spawnError)
                assert.ok(!closed, 'Watch process exited before completing the run')
                assert.ok(performance.now() < deadline, `Timed out waiting for ${name} run ${count}`)
                await sleep(50)
            }
            assert.equal(
                runs[count - 1].exitCode,
                expectedExitCode,
                `${name} run ${count} exited with an unexpected code`
            )
        }

        await execute({ driver, waitForRun })

        const result = await stopWatchProcess(child, exit)
        assert.deepEqual(result, { code: 0, signal: null })
        if (expectSessionCleanup) {
            assert.equal(driver.deleted.length, driver.created.length, 'Shutdown must delete every retained session')
            assert.deepEqual(new Set(driver.deleted), new Set(driver.created), 'Shutdown must delete the created sessions')
            assert.equal(driver.sessions.size, 0, 'Shutdown must delete all retained sessions')
        } else {
            assert.deepEqual(driver.deleted, [], 'Watch mode without retained sessions does not attach sessions during shutdown')
            assert.equal(driver.sessions.size, driver.created.length, 'Every recreated session remains owned by the fixture')
        }
        assert.deepEqual(driver.unexpected, [], 'The fixture received unexpected WebDriver commands')
    } catch (error) {
        throw new Error(`${name} smoke test failed: ${error.message}\n${output}`, { cause: error })
    } finally {
        try {
            if (child) {
                await stopWatchProcess(child, exit)
            }
        } finally {
            driver.server.closeAllConnections()
            await new Promise((resolve) => driver.server.close(resolve))
            await removeTemporaryDirectory(temporaryDirectory, temporaryDirectoryPrefix)
        }
    }
}
