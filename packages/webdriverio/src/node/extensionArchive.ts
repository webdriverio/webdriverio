import fs from 'node:fs'
import path from 'node:path'
import { ZipArchive } from 'archiver'
import type { remote } from 'webdriver'

const ARCHIVE_EXTENSIONS = new Set(['.zip', '.xpi', '.crx'])

/**
 * Turn a path from the test runner into the `extensionData` payload
 * `webExtension.install` expects.
 *
 * Local sessions send `path` or `archivePath` and do not read the file.
 * Remote sessions read an archive, or zip a directory in memory, and send `base64`,
 * because the browser does not share this machine's disk.
 */
export async function extensionDataFromPath (
    input: string,
    remoteSession: boolean
): Promise<remote.WebExtensionExtensionData> {
    const resolved = path.resolve(input)
    const kind = ARCHIVE_EXTENSIONS.has(path.extname(resolved).toLowerCase()) ? 'archive' : 'directory'
    if (!remoteSession) {
        return kind === 'archive'
            ? { type: 'archivePath', path: resolved }
            : { type: 'path', path: resolved }
    }

    const value = await readExtensionBase64(resolved, kind)
    return { type: 'base64', value }
}

/**
 * Read an extension archive, or zip an unpacked directory, and return base64.
 * The archive is built in memory and never written to disk.
 */
async function readExtensionBase64 (absolutePath: string, kind: 'archive' | 'directory'): Promise<string> {
    if (kind === 'archive') {
        try {
            const bytes = await fs.promises.readFile(absolutePath)
            return bytes.toString('base64')
        } catch (err) {
            throw new Error(`installExtension could not read archive ${absolutePath} to send it to the remote browser: ${errorMessage(err)}`)
        }
    }

    let stat: fs.Stats
    try {
        stat = await fs.promises.stat(absolutePath)
    } catch (err) {
        throw new Error(`installExtension could not read directory ${absolutePath} to send it to the remote browser: ${errorMessage(err)}`)
    }
    if (!stat.isDirectory()) {
        throw new Error(`installExtension expected a directory at ${absolutePath}`)
    }

    const zip = await zipDirectory(absolutePath)
    return zip.toString('base64')
}

function zipDirectory (dir: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = []
        const archive = new ZipArchive()
        let settled = false
        const fail = (err: unknown) => {
            if (settled) {
                return
            }
            settled = true
            reject(err instanceof Error ? err : new Error(errorMessage(err)))
        }

        archive.on('error', fail)
        archive.on('data', (chunk: Uint8Array) => chunks.push(chunk))
        archive.on('end', () => {
            if (settled) {
                return
            }
            settled = true
            resolve(Buffer.concat(chunks))
        })

        try {
            appendDirectory(archive, dir, '', new Set())
        } catch (err) {
            fail(err)
            return
        }

        archive.finalize()
    })
}

/**
 * Extension archives must contain `manifest.json` at the zip root, so the
 * directory contents are stored without an extra top-level folder.
 * `stat` follows symbolic links so a linked script or asset is packed.
 * `seen` stops a symlink cycle from walking the same directory forever.
 */
function appendDirectory (archive: ZipArchive, dir: string, prefix: string, seen: Set<string>) {
    const realDir = fs.realpathSync(dir)
    if (seen.has(realDir)) {
        return
    }
    seen.add(realDir)

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        const name = prefix ? `${prefix}/${entry.name}` : entry.name
        let stat: fs.Stats
        try {
            stat = fs.statSync(full)
        } catch (err) {
            throw new Error(`installExtension could not read ${full}: ${errorMessage(err)}`)
        }
        if (stat.isDirectory()) {
            appendDirectory(archive, full, name, seen)
        } else if (stat.isFile()) {
            archive.append(fs.createReadStream(full), { name })
        }
    }
}

function errorMessage (err: unknown) {
    return err instanceof Error ? err.message : String(err)
}
