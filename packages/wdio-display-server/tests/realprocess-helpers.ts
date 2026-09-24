import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

/** Puts `stubPath` on PATH as `name`. */
export async function installStubOnPath(name: string, stubPath: string): Promise<() => Promise<void>> {
    const binDir = await mkdtemp(path.join(os.tmpdir(), `wdio-${name.toLowerCase()}-stub-`))
    const shim = path.join(binDir, name)
    await writeFile(shim, `#!/bin/sh\nexec "${process.execPath}" "${stubPath}" "$@"\n`)
    await chmod(shim, 0o755)
    const originalPath = process.env.PATH
    process.env.PATH = `${binDir}${path.delimiter}${originalPath ?? ''}`
    return async () => {
        if (originalPath === undefined) {
            delete process.env.PATH
        } else {
            process.env.PATH = originalPath
        }
        await rm(binDir, { recursive: true, force: true }).catch(() => {})
    }
}
