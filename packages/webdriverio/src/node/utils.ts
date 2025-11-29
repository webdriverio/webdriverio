import path from 'node:path'
import fs from 'node:fs/promises'

/**
 * check if directory exists
 */
export async function assertDirectoryExists(filepath: string) {
    const exist = await fs.access(path.dirname(filepath)).then(() => true, () => false)
    if (!exist) {
        throw new Error(`directory (${path.dirname(filepath)}) doesn't exist`)
    }
}
