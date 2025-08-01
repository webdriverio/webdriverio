import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const packagesDir = path.resolve(__dirname, 'packages')

// 🔧 Specify custom versions for specific dependencies here
const customVersions = {
    '@wdio/runner': 'https://github.com/pegnovi/webdriverio/releases/download/v9.18.1-runner-custom/wdio-runner-9.18.1.tgz',
    '@wdio/local-runner': 'https://github.com/pegnovi/webdriverio/releases/download/v9.18.1-runner-custom/wdio-local-runner-9.18.1.tgz'
}

// 📦 List of packages to build
const targetPackages = [
    'wdio-runner',
    'wdio-browser-runner',
    'wdio-local-runner'
]

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

// Step 2: Replace workspace:* with actual versions or custom overrides
const resolveDeps = (deps = {}, versionMap) => {
    const resolved = {}
    for (const [dep, version] of Object.entries(deps)) {
        if (customVersions[dep]) {
            resolved[dep] = customVersions[dep]
        } else if (version.startsWith('workspace:')) {
            resolved[dep] = versionMap[dep] || version
        } else {
            resolved[dep] = version
        }
    }
    return resolved
}

// Step 3: Process each target package
const versionMap = await getWorkspaceVersions()

for (const pkgName of targetPackages) {
    const pkgPath = path.resolve(packagesDir, `${pkgName}/package.json`)
    const backupPath = pkgPath + '.bak'

    console.log(`📦 Packing ${pkgName}...`)

    const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'))
    await fs.writeFile(backupPath, JSON.stringify(pkg, null, 2))

    pkg.dependencies = resolveDeps(pkg.dependencies, versionMap)
    pkg.devDependencies = resolveDeps(pkg.devDependencies, versionMap)

    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2))

    try {
        await execAsync('pnpm pack', {
            cwd: path.dirname(pkgPath),
            stdio: 'inherit',
        })
        console.log(`✅ ${pkgName} packed successfully.`)
    } catch (err) {
        console.error(`❌ Failed to pack ${pkgName}:`, err.stderr || err)
    }

    await fs.rename(backupPath, pkgPath)
    console.log(`🔄 Restored original package.json for ${pkgName}\n`)
}