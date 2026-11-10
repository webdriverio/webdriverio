/**
 * Run `npm init wdio` the way a user runs it, with the local create-wdio build.
 * An npm override gives the `@wdio/cli` from npm the local create-wdio too, so the
 * local wizard writes the project and installs its packages from npm.
 *
 * - web: the wizard defaults, then the generated example test
 * - android, ios, macos: the Appium setups; the install must succeed (no device needed)
 *
 * Usage: pnpm run test:e2e:create-wdio [web|android|ios|macos ...]
 */
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import url from 'node:url'
import { spawnSync } from 'node:child_process'

const repoRoot = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..')

// pnpm passes its settings to scripts as npm_config_* variables; a user starts from a clean shell
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(npm|pnpm)_/i.test(key)))

interface Setup {
    flags: string[]
    // packages and the major the wizard must install
    installs: Record<string, number>
    runTest?: boolean
}

const SETUPS: Record<string, Setup> = {
    web: { flags: [], installs: { '@wdio/cli': 10 }, runTest: true },
    android: { flags: ['--mobile-environment', 'android'], installs: { appium: 3, 'appium-uiautomator2-driver': 8 } },
    ios: { flags: ['--mobile-environment', 'ios'], installs: { appium: 3, 'appium-xcuitest-driver': 12 } },
    macos: { flags: ['--runner', 'desktop', '--desktop-framework', 'macos'], installs: { appium: 3, 'appium-mac2-driver': 4 } }
}

function run (command: string, args: string[], cwd: string) {
    console.log(`\n$ ${command} ${args.join(' ')}\n  (in ${cwd})\n`)
    // npm and npx are .cmd scripts on Windows, which only run through a shell
    const result = spawnSync(command, args, { cwd, env, stdio: 'inherit', shell: process.platform === 'win32' })
    if (result.error || result.status !== 0) {
        throw new Error(`"${command} ${args.join(' ')}" failed with ${result.error?.message ?? `exit code ${result.status}`}`)
    }
}

async function readPackage (dir: string) {
    return JSON.parse(await fs.readFile(path.join(dir, 'package.json'), 'utf8')) as { version: string, scripts?: Record<string, string> }
}

async function runSetup (name: string, setup: Setup, tmpDir: string, tarball: string) {
    const projectDir = path.join(tmpDir, name)
    await fs.mkdir(projectDir)
    await fs.writeFile(path.join(projectDir, 'package.json'), JSON.stringify({
        name: `create-wdio-e2e-${name}`,
        type: 'module',
        // the @wdio/cli from npm runs the wizard of its create-wdio dependency
        overrides: { 'create-wdio': `file:../${tarball}` }
    }, null, 2))

    // `npm init wdio` runs `npm exec create-wdio`; a relative path keeps spaces out of the shell line
    run('npm', ['exec', '--yes', `--package=file:../${tarball}`, '--', 'create-wdio', '.', '--yes', ...setup.flags], projectDir)

    const wizard = await readPackage(path.join(projectDir, 'node_modules', 'create-wdio'))
    const local = await readPackage(path.join(repoRoot, 'packages', 'create-wdio'))
    if (wizard.version !== local.version) {
        throw new Error(`the wizard came from create-wdio ${wizard.version}, not the local build ${local.version}`)
    }
    for (const [pkg, major] of Object.entries(setup.installs)) {
        const { version } = await readPackage(path.join(projectDir, 'node_modules', pkg))
        if (Number(version.split('.')[0]) !== major) {
            throw new Error(`${pkg}@${version} is installed, expected major ${major}`)
        }
        console.log(`✔ ${pkg}@${version}`)
    }

    if (setup.runTest) {
        if (!(await readPackage(projectDir)).scripts?.wdio) {
            throw new Error('the generated package.json has no "wdio" script')
        }
        run('npm', ['run', 'wdio'], projectDir)
    }
}

const names = process.argv.length > 2 ? process.argv.slice(2) : Object.keys(SETUPS)
const unknown = names.filter((name) => !SETUPS[name])
if (unknown.length > 0) {
    throw new Error(`unknown setup ${unknown.join(', ')}, use: ${Object.keys(SETUPS).join(', ')}`)
}

const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'create-wdio-e2e-'))
run('pnpm', ['pack', '--pack-destination', tmpDir], path.join(repoRoot, 'packages', 'create-wdio'))
const tarball = (await fs.readdir(tmpDir)).find((file) => file.endsWith('.tgz'))
if (!tarball) {
    throw new Error(`pnpm pack wrote no tarball to ${tmpDir}`)
}

const failed: string[] = []
for (const name of names) {
    try {
        await runSetup(name, SETUPS[name], tmpDir, tarball)
        console.log(`\n✅ ${name}: npm init wdio set up the project`)
    } catch (err) {
        failed.push(name)
        console.error(`\n❌ ${name}: ${err instanceof Error ? err.message : err}\nProject kept in ${path.join(tmpDir, name)}`)
    }
}

if (failed.length > 0) {
    console.error(`\n❌ failed: ${failed.join(', ')}`)
    process.exitCode = 1
} else {
    await fs.rm(tmpDir, { recursive: true, force: true })
}
