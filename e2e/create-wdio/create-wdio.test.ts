/**
 * Run `npm init wdio` the way a user runs it, with the local create-wdio build.
 * An npm override gives the `@wdio/cli` from npm the local create-wdio too, so the
 * local wizard writes the project and installs its packages from npm.
 *
 * - web: the wizard defaults, then the generated example test
 * - android, ios, macos: the Appium setups; the install must succeed (no device needed)
 *
 * Usage: pnpm run test:e2e:create-wdio [-t web|android|ios|macos]
 */
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import url from 'node:url'
import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

const repoRoot = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..')
const isWindows = process.platform === 'win32'

/**
 * A user starts from a clean shell. Remove:
 * - the npm_* / pnpm_* settings of the pnpm script; npm gives its npm_config_user_agent to the wizard,
 *   which then installs with pnpm
 * - NODE_PATH of the pnpm bin shim: the project would find the packages of this repo
 * - the variables that Vitest sets
 * Keep the npm connection settings of the user.
 * Any case: on Windows, NPM_CONFIG_USER_AGENT and npm_config_user_agent are one variable.
 */
const NOT_A_USER_ENV = /^(npm_|pnpm_|VITEST|(PNPM_SCRIPT_SRC_DIR|NODE_PATH|NODE_ENV|FORCE_TTY|TEST|MODE|DEV|PROD|SSR|BASE_URL)$)/i
const USER_NPM_SETTINGS = /^npm_config_(registry|proxy|https_proxy|noproxy|userconfig|cafile|strict_ssl)$/i
const env = Object.fromEntries(Object.entries(process.env)
    .filter(([key]) => USER_NPM_SETTINGS.test(key) || !NOT_A_USER_ENV.test(key)))

interface Setup {
    name: string
    flags: string[]
    // packages and the major the wizard must install
    installs: Record<string, number>
    runTest?: boolean
}

// a cold npm cache takes 6-16 s for each setup on macOS: room for a slow runner
const SETUP_TIMEOUT = 5 * 60 * 1000
// the project must get the @wdio/cli major of this create-wdio
const { version: localVersion } = JSON.parse(await fs.readFile(path.join(repoRoot, 'packages', 'create-wdio', 'package.json'), 'utf8')) as { version: string }
const CLI_MAJOR = Number(localVersion.split('.')[0])

const SETUPS: Setup[] = [
    { name: 'web', flags: [], installs: { '@wdio/cli': CLI_MAJOR }, runTest: true },
    { name: 'android', flags: ['--mobile-environment', 'android'], installs: { appium: 3, 'appium-uiautomator2-driver': 8 } },
    { name: 'ios', flags: ['--mobile-environment', 'ios'], installs: { appium: 3, 'appium-xcuitest-driver': 12 } },
    { name: 'macos', flags: ['--runner', 'desktop', '--desktop-framework', 'macos'], installs: { appium: 3, 'appium-mac2-driver': 4 } }
]

const running = new Set<ChildProcess>()

// npm starts more processes (the wizard, then the installs): stop all of them
function killTree (child: ChildProcess) {
    if (child.pid === undefined || child.exitCode !== null || child.signalCode !== null) {
        return
    }
    if (isWindows) {
        spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
    } else {
        try {
            // the child is the leader of its own process group (detached)
            process.kill(-child.pid, 'SIGKILL')
        } catch {
            // the group has stopped
        }
    }
}

function run (command: string, args: string[], cwd: string, signal?: AbortSignal) {
    console.log(`\n$ ${command} ${args.join(' ')}\n  (in ${cwd})\n`)
    return new Promise<void>((resolve, reject) => {
        const child = spawn(command, args, {
            cwd,
            env,
            // no stdin: the wizard runs with `--yes`, and a detached process must not read the terminal
            stdio: ['ignore', 'inherit', 'inherit'],
            // npm and npx are .cmd scripts on Windows, which only run through a shell
            shell: isWindows,
            // its own process group, to stop the process tree when the test times out
            detached: !isWindows
        })
        running.add(child)
        const onAbort = () => killTree(child)
        signal?.addEventListener('abort', onAbort, { once: true })
        const done = (err?: Error) => {
            running.delete(child)
            signal?.removeEventListener('abort', onAbort)
            return err ? reject(err) : resolve()
        }
        child.once('error', (err) => done(new Error(`"${command} ${args.join(' ')}" failed: ${err.message}`)))
        child.once('close', (code, sig) => done(code === 0
            ? undefined
            : new Error(`"${command} ${args.join(' ')}" failed with ${sig ? `signal ${sig}` : `exit code ${code}`}`)))
    })
}

async function readPackage (dir: string) {
    return JSON.parse(await fs.readFile(path.join(dir, 'package.json'), 'utf8')) as { version: string, scripts?: Record<string, string> }
}

describe('npm init wdio', () => {
    let tmpDir: string
    let tarball: string
    let failed = false

    beforeAll(async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'create-wdio-e2e-'))
        await run('pnpm', ['pack', '--pack-destination', tmpDir], path.join(repoRoot, 'packages', 'create-wdio'))
        const file = (await fs.readdir(tmpDir)).find((name) => name.endsWith('.tgz'))
        if (!file) {
            throw new Error(`pnpm pack wrote no tarball to ${tmpDir}`)
        }
        tarball = file
    })

    afterAll(async () => {
        running.forEach(killTree)
        if (tmpDir && !failed) {
            await fs.rm(tmpDir, { recursive: true, force: true })
        }
    })

    for (const setup of SETUPS) {
        test(`sets up the ${setup.name} project`, async ({ signal, onTestFailed }) => {
            const projectDir = path.join(tmpDir, setup.name)
            onTestFailed(() => {
                failed = true
                console.error(`\n❌ ${setup.name}: project kept in ${projectDir}`)
            })

            await fs.mkdir(projectDir)
            await fs.writeFile(path.join(projectDir, 'package.json'), JSON.stringify({
                name: `create-wdio-e2e-${setup.name}`,
                type: 'module',
                // the @wdio/cli from npm runs the wizard of its create-wdio dependency
                overrides: { 'create-wdio': `file:../${tarball}` }
            }, null, 2))

            // `npm init wdio` runs `npm exec create-wdio`; a relative path keeps spaces out of the shell line
            await run('npm', ['exec', '--yes', `--package=file:../${tarball}`, '--', 'create-wdio', '.', '--yes', ...setup.flags], projectDir, signal)

            // the local version is often the published one: compare the wizard code
            const wizardFile = path.join('build', 'config', 'cli.js')
            const wizard = await fs.readFile(path.join(projectDir, 'node_modules', 'create-wdio', wizardFile), 'utf8')
            const local = await fs.readFile(path.join(repoRoot, 'packages', 'create-wdio', wizardFile), 'utf8')
            expect(wizard === local, 'the wizard must come from the local create-wdio build').toBe(true)

            for (const [pkg, major] of Object.entries(setup.installs)) {
                const { version } = await readPackage(path.join(projectDir, 'node_modules', pkg))
                expect(Number(version.split('.')[0]), `${pkg}@${version} major`).toBe(major)
            }

            if (setup.runTest) {
                expect((await readPackage(projectDir)).scripts?.wdio, 'the generated "wdio" script').toBeTruthy()
                await run('npm', ['run', 'wdio'], projectDir, signal)
            }

            // here, not in afterAll: on Windows, removing the 4 projects takes more than the hook timeout
            await fs.rm(projectDir, { recursive: true, force: true })
        }, SETUP_TIMEOUT)
    }
})
