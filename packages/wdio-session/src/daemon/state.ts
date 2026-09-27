import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'

import { STATE_VERSION } from '../constants.js'
import type { StateFile } from '../types.js'

interface RuntimeEnv {
    env?: NodeJS.ProcessEnv
    platform?: NodeJS.Platform
    uid?: number
    tmpdir?: string
}

export function getRuntimeDir ({ env = process.env, platform = process.platform, uid, tmpdir = os.tmpdir() }: RuntimeEnv = {}) {
    if (env.WDIO_SESSION_DIR) {
        return path.resolve(env.WDIO_SESSION_DIR)
    }
    if (platform === 'win32') {
        return path.win32.join(env.LOCALAPPDATA || tmpdir, 'wdio-session')
    }
    if (env.XDG_RUNTIME_DIR) {
        return path.posix.join(env.XDG_RUNTIME_DIR, 'wdio-session')
    }
    const id = uid ?? (typeof process.getuid === 'function' ? process.getuid() : 0)
    return path.posix.join(tmpdir, `wdio-session-${id}`)
}

export function ensureRuntimeDir (dir = getRuntimeDir()) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
    if (process.platform !== 'win32') {
        fs.chmodSync(dir, 0o700)
    }
    return dir
}

export function getArtifactsDir (name: string, cwd = process.cwd(), env = process.env) {
    const root = env.WDIO_SESSION_ARTIFACTS
        ? path.resolve(cwd, env.WDIO_SESSION_ARTIFACTS)
        : path.join(cwd, '.wdio', 'session')
    return path.join(root, name)
}

export function getSocketPath (runtimeDir: string, name: string, platform: NodeJS.Platform = process.platform) {
    if (platform === 'win32') {
        const hash = crypto.createHash('sha1').update(runtimeDir).digest('hex').slice(0, 8)
        return `\\\\.\\pipe\\wdio-session-${hash}-${name}`
    }
    return path.posix.join(runtimeDir, `${name}.sock`)
}

export function getStatePath (runtimeDir: string, name: string) {
    return path.join(runtimeDir, `${name}.json`)
}

export function readState (runtimeDir: string, name: string): StateFile | undefined {
    try {
        return JSON.parse(fs.readFileSync(getStatePath(runtimeDir, name), 'utf-8'))
    } catch {
        return undefined
    }
}

/**
 * Create the state file for a new session. Fails when the file already
 * exists so that two concurrent `open` calls cannot claim the same name.
 */
export function createState (runtimeDir: string, state: Omit<StateFile, 'version'>) {
    const file = getStatePath(runtimeDir, state.name)
    const fd = fs.openSync(file, 'wx', 0o600)
    try {
        fs.writeSync(fd, JSON.stringify({ version: STATE_VERSION, ...state }, null, 2))
    } finally {
        fs.closeSync(fd)
    }
}

export function writeState (runtimeDir: string, state: StateFile) {
    const file = getStatePath(runtimeDir, state.name)
    const tmp = `${file}.${process.pid}.tmp`
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2), { mode: 0o600 })
    fs.renameSync(tmp, file)
}

export function updateState (runtimeDir: string, name: string, patch: Partial<StateFile>) {
    const current = readState(runtimeDir, name)
    if (!current) {
        return
    }
    writeState(runtimeDir, { ...current, ...patch })
}

export function removeState (runtimeDir: string, name: string) {
    for (const file of [getStatePath(runtimeDir, name), getSocketPath(runtimeDir, name)]) {
        if (file.startsWith('\\\\.\\pipe\\')) {
            continue
        }
        try {
            fs.rmSync(file, { force: true })
        } catch {
            // ignore
        }
    }
}

/**
 * The daemon is started detached, so it leads a process group that also
 * holds its driver and browser. When the daemon died without cleaning up
 * (e.g. SIGKILL), kill what is left of that group.
 */
export function killOrphans (pid?: number | null, platform = process.platform) {
    if (!pid || platform === 'win32' || isPidAlive(pid)) {
        return
    }
    try {
        process.kill(-pid, 'SIGKILL')
    } catch {
        // group is gone
    }
}

/**
 * Remove the files of a session whose daemon is gone, plus its orphans.
 */
export function removeStaleState (runtimeDir: string, state: { name: string, pid?: number | null }) {
    killOrphans(state.pid)
    removeState(runtimeDir, state.name)
}

export function listStates (runtimeDir: string): StateFile[] {
    let files: string[] = []
    try {
        files = fs.readdirSync(runtimeDir)
    } catch {
        return []
    }
    return files
        .filter((f) => f.endsWith('.json'))
        .map((f) => readState(runtimeDir, f.slice(0, -'.json'.length)))
        .filter((s): s is StateFile => Boolean(s))
}

export function isPidAlive (pid?: number | null) {
    if (!pid) {
        return false
    }
    try {
        process.kill(pid, 0)
        return true
    } catch (err) {
        return (err as NodeJS.ErrnoException).code === 'EPERM'
    }
}
