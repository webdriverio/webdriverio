import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const packagesDir = path.resolve(__dirname, 'packages')
const runnerPkgPath = path.resolve(
    packagesDir,
    'wdio-browser-runner/package.json'
)
const backupPath = runnerPkgPath + '.bak'

// Step 1: Build a map of all workspace package versions
const getWorkspaceVersions = async () => {
    const entries = await fs.readdir(packagesDir, { withFileTypes: true })
    const versionMap = {}

    for (const entry of entries) {
        if (entry.isDirectory()) {
            const pkgPath = path.join(packagesDir, entry.name, 'package.json')
            try {
                const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'))
                versionMap[pkg.name] = pkg.version
            } catch {
                continue
            }
        }
    }

    return versionMap
}

// Step 2: Replace workspace:* with actual versions
const resolveDeps = (deps = {}, versionMap) => {
    const resolved = {}
    for (const [dep, version] of Object.entries(deps)) {
        if (version.startsWith('workspace:')) {
            resolved[dep] = versionMap[dep] || version
        } else {
            resolved[dep] = version
        }
    }
    return resolved
}

const versionMap = await getWorkspaceVersions()
const runnerPkg = JSON.parse(await fs.readFile(runnerPkgPath, 'utf-8'))
await fs.writeFile(backupPath, JSON.stringify(runnerPkg, null, 2))

runnerPkg.dependencies = resolveDeps(runnerPkg.dependencies, versionMap)
runnerPkg.devDependencies = resolveDeps(runnerPkg.devDependencies, versionMap)

await fs.writeFile(runnerPkgPath, JSON.stringify(runnerPkg, null, 2))

try {
    await execAsync('pnpm pack', {
        cwd: path.dirname(runnerPkgPath),
        stdio: 'inherit',
    })
    console.log('✅ Package packed successfully.')
} catch (err) {
    console.error('❌ Failed to pack:', err.stderr || err)
}

await fs.rename(backupPath, runnerPkgPath)
console.log('✅ Original package.json restored.')
