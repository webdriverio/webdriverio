import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import url from 'node:url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export function rebuildSharp() {
    try {
        const pnpmDir = path.join(__dirname, '..', '..', 'node_modules', '.pnpm')

        if (!fs.existsSync(pnpmDir)) {
            console.log('No .pnpm directory found, skipping sharp rebuild')
            return
        }

        const sharpDir = fs.readdirSync(pnpmDir).find(dir => dir.startsWith('sharp@'))

        if (!sharpDir) {
            console.log('No sharp package found, skipping rebuild')
            return
        }

        const sharpPath = path.join(pnpmDir, sharpDir, 'node_modules', 'sharp')

        if (!fs.existsSync(sharpPath)) {
            console.log('Sharp directory not found, skipping rebuild')
            return
        }

        console.log('Rebuilding sharp native binaries...')
        process.chdir(sharpPath)
        execSync('pnpm rebuild', { stdio: 'inherit' })
        console.log('Sharp rebuild completed successfully')

        // Return to original directory
        process.chdir(path.join(__dirname, '..', '..'))
    } catch (error) {
        console.log('Sharp rebuild skipped:', (error as Error).message)
    }
}
