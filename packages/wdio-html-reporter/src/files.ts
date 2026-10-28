import fs from 'node:fs'
import path from 'node:path'

/**
 * Write a file, and create its folder first when it does not exist
 */
export function writeFile (file: string, data: string | Buffer) {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, data)
}

/**
 * Remove the content of a folder, and create the folder when it does not exist
 */
export function emptyDir (dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
        return
    }
    for (const entry of fs.readdirSync(dir)) {
        fs.rmSync(path.join(dir, entry), { recursive: true, force: true })
    }
}
