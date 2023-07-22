import fs from 'node:fs/promises'

export function hasFile (p: string) {
    return fs.access(p).then(() => true, () => false)
}
