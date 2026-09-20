import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

export function findWorkspaceRoot (fromDir: string): string {
    let current = path.resolve(fromDir)
    while (true) {
        if (fs.existsSync(path.join(current, 'pnpm-workspace.yaml'))) {
            return current
        }
        const parent = path.dirname(current)
        if (parent === current) {
            throw new Error('Could not find workspace root (pnpm-workspace.yaml)')
        }
        current = parent
    }
}

export const workspaceRoot: string = findWorkspaceRoot(
    path.dirname(url.fileURLToPath(import.meta.url))
)

export function isMainModule (metaUrl: string): boolean {
    const entry = process.argv[1]
    if (!entry) {
        return false
    }
    return path.resolve(entry) === url.fileURLToPath(metaUrl)
}

export function toPosix (filePath: string): string {
    return filePath.replace(/\\/g, '/').replace(/^\.\//, '')
}
