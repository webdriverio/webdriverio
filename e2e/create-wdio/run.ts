/**
 * Run `npm init wdio` the way a user runs it, with the local create-wdio build:
 * pack the package, scaffold a project with the wizard defaults, then run the
 * generated example test. @wdio/cli and the packages it installs come from npm.
 * Usage: pnpm run test:e2e:create-wdio
 */
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import url from 'node:url'
import { spawnSync } from 'node:child_process'

const repoRoot = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..')

// pnpm passes its settings to scripts as npm_config_* variables; a user starts from a clean shell
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(npm|pnpm)_/i.test(key)))

function run (command: string, args: string[], cwd: string) {
    console.log(`\n$ ${command} ${args.join(' ')}\n  (in ${cwd})\n`)
    // npm and npx are .cmd scripts on Windows, which only run through a shell
    const result = spawnSync(command, args, { cwd, env, stdio: 'inherit', shell: process.platform === 'win32' })
    if (result.error || result.status !== 0) {
        throw new Error(`"${command} ${args.join(' ')}" failed with ${result.error?.message ?? `exit code ${result.status}`}`)
    }
}

const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'create-wdio-e2e-'))
const projectDir = path.join(tmpDir, 'project')
await fs.mkdir(projectDir)

try {
    run('pnpm', ['pack', '--pack-destination', tmpDir], path.join(repoRoot, 'packages', 'create-wdio'))
    const tarball = (await fs.readdir(tmpDir)).find((file) => file.endsWith('.tgz'))
    if (!tarball) {
        throw new Error(`pnpm pack wrote no tarball to ${tmpDir}`)
    }

    // `npm init wdio` runs `npm exec create-wdio`; a relative path keeps spaces out of the shell line
    run('npm', ['exec', '--yes', `--package=file:../${tarball}`, '--', 'create-wdio', '.', '--yes'], projectDir)

    const pkg = JSON.parse(await fs.readFile(path.join(projectDir, 'package.json'), 'utf8'))
    if (!pkg.scripts?.wdio) {
        throw new Error(`the generated package.json has no "wdio" script:\n${JSON.stringify(pkg, null, 2)}`)
    }

    run('npm', ['run', 'wdio'], projectDir)
    await fs.rm(tmpDir, { recursive: true, force: true })
    console.log('\n✅ npm init wdio created a project and its example test passed')
} catch (err) {
    console.error(`\n❌ ${err instanceof Error ? err.message : err}\nProject kept in ${projectDir}`)
    process.exitCode = 1
}
