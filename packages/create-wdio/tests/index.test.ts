import fs from 'node:fs/promises'
import semver from 'semver'
import { resolve } from 'import-meta-resolve'
import { vi, test, expect, beforeEach, afterEach, describe, it } from 'vitest'
import { Command } from 'commander'
import { execSync } from 'node:child_process'
import { execa } from 'execa'
import { run, createWebdriverIO } from '../src/index.js'
import { SUPPORTED_NODE_VERSIONS } from '../src/constants.js'
import { runProgram } from '../src/utils.js'
import type { ProgramOpts } from '../src/types.js'
import { getInstallCommand, installPackages } from '../src/install.js'

vi.mock('node:fs/promises', () => ({
    default: {
        access: vi.fn(),
        mkdir: vi.fn(),
        writeFile: vi.fn()
    }
}))
vi.mock('node:child_process', () => ({
    execSync: vi.fn()
}))
vi.mock('import-meta-resolve', () => ({
    resolve: vi.fn()
}))
vi.mock('commander')
vi.mock('semver', () => ({
    default: {
        satisfies: vi.fn().mockReturnValue(true)
    }
}))
vi.mock('../src/utils.js', async (importActual) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    const actual = await importActual<typeof import('../src/utils.js')>()
    return {
        ...actual,
        runProgram: vi.fn(),
        colorItBold: vi.fn((log) => log),
        colorIt: vi.fn((log) => log),
        getPackageVersion: vi.fn().mockReturnValue('0.1.1'),
        shouldUseYarn: vi.fn().mockReturnValue(true)
    }
})

const consoleLog = console.log.bind(console)
beforeEach(() => {
    console.log = vi.fn()
    vi.mocked(runProgram).mockClear()
    vi.mocked(resolve).mockImplementation(() => {
        throw new Error('foo')
    })
    vi.mocked(execSync).mockReturnValue(`
    ├── corepack@0.20.0
    ├── npm@10.2.0
    └── yarn@1.22.19
    `)
    vi.mocked(fs.access).mockResolvedValue()
})

test('run', async () => {
    const op = vi.fn().mockResolvedValue({})
    await run(op)

    expect(op).toBeCalledTimes(1)
    expect(op).toBeCalledWith('foobar')
    expect(new Command().arguments).toBeCalledWith('[project-path]')
    expect(console.log).toBeCalledTimes(1)
    expect(vi.mocked(console.log).mock.calls[0][0]).toContain('oooooooooooo')
    expect(vi.mocked(console.log).mock.calls[0][1]).toContain('Next-gen browser and mobile automation')
})

test('does not run if Node.js version is too low', async () => {
    const consoleLog = vi.spyOn(console, 'log')
    vi.mocked(semver.satisfies).mockReturnValue(false)
    const op = vi.fn().mockResolvedValue({})
    await run(op)
    expect(op).toBeCalledTimes(0)
    expect(semver.satisfies).toBeCalledWith(process.version, SUPPORTED_NODE_VERSIONS)
    expect(consoleLog).toBeCalledWith(expect.stringContaining('Please update to Node.js v22.23.4, v24.22.1, v26.12.1'))
})

test.each([
    ['22.22.0', false], ['22.23.4', true], ['23.11.0', false], ['24.21.0', false],
    ['24.22.1', true], ['25.9.0', false], ['26.12.0', false], ['26.12.1', true], ['27.0.0', true]
])('supports Node.js %s: %s', async (version, supported) => {
    const actual = await vi.importActual<{ default: typeof semver }>('semver')
    expect(actual.default.satisfies(version, SUPPORTED_NODE_VERSIONS)).toBe(supported)
})

test('createWebdriverIO with Yarn', async () => {
    vi.stubEnv('npm_config_user_agent', 'yarn/4.5.0 npm/? node/v20.11.0 darwin arm64')
    await createWebdriverIO({ npmTag: 'latest' } as ProgramOpts)
    expect(runProgram).toBeCalledWith(
        'yarn',
        ['add', '@wdio/cli@latest'],
        expect.any(Object)
    )
    expect(runProgram).toBeCalledWith(
        'yarn',
        ['exec', 'wdio', 'config', '--npm-tag', 'latest'],
        expect.any(Object),
        true
    )
    expect(runProgram).toBeCalledTimes(2)
    expect(fs.mkdir).toBeCalledTimes(0)
    expect(fs.writeFile).toBeCalledTimes(0)
})

test('createWebdriverIO with NPM', async () => {
    vi.stubEnv('npm_config_user_agent', 'npm/10.2.4 node/v20.11.0 darwin arm64 workspaces/false')
    await createWebdriverIO({ npmTag: 'latest' } as ProgramOpts)
    expect(runProgram).toBeCalledWith(
        'npm',
        ['install', '@wdio/cli@latest'],
        expect.any(Object)
    )
    expect(runProgram).toBeCalledWith(
        'npx',
        ['wdio', 'config', '--npm-tag', 'latest'],
        expect.any(Object),
        true
    )
    expect(runProgram).toBeCalledTimes(2)
    expect(fs.mkdir).toBeCalledTimes(0)
    expect(fs.writeFile).toBeCalledTimes(0)
})

test('createWebdriverIO with invalid agent should run npm commands', async () => {
    vi.stubEnv('npm_config_user_agent', 'invalid/10.2.4 node/v20.11.0 darwin arm64 workspaces/false')
    await createWebdriverIO({ npmTag: 'latest' } as ProgramOpts)
    expect(runProgram).toBeCalledWith(
        'npm',
        ['install', '@wdio/cli@latest'],
        expect.any(Object)
    )
    expect(runProgram).toBeCalledWith(
        'npx',
        ['wdio', 'config', '--npm-tag', 'latest'],
        expect.any(Object),
        true
    )
    expect(runProgram).toBeCalledTimes(2)
    expect(fs.mkdir).toBeCalledTimes(0)
    expect(fs.writeFile).toBeCalledTimes(0)
})

test('createWebdriverIO with no npm user agent should run npm commands', async () => {
    vi.stubEnv('npm_config_user_agent', '')
    await createWebdriverIO({ npmTag: 'latest' } as ProgramOpts)
    expect(runProgram).toBeCalledWith(
        'npm',
        ['install', '@wdio/cli@latest'],
        expect.any(Object)
    )
    expect(runProgram).toBeCalledWith(
        'npx',
        ['wdio', 'config', '--npm-tag', 'latest'],
        expect.any(Object),
        true
    )
    expect(runProgram).toBeCalledTimes(2)
    expect(fs.mkdir).toBeCalledTimes(0)
    expect(fs.writeFile).toBeCalledTimes(0)
})

test('createWebdriverIO with pnpm', async () => {
    vi.stubEnv('npm_config_user_agent', 'pnpm/9.10.0 npm/? node/v20.11.0 darwin arm64')
    await createWebdriverIO({ npmTag: 'latest' } as ProgramOpts)
    expect(runProgram).toBeCalledWith(
        'pnpm',
        ['add', '@wdio/cli@latest'],
        expect.any(Object)
    )
    expect(runProgram).toBeCalledWith(
        'pnpm',
        ['exec', 'wdio', 'config', '--npm-tag', 'latest'],
        expect.any(Object),
        true
    )
    expect(runProgram).toBeCalledTimes(2)
    expect(fs.mkdir).toBeCalledTimes(0)
    expect(fs.writeFile).toBeCalledTimes(0)
})

test('createWebdriverIO with bun', async () => {
    vi.stubEnv('npm_config_user_agent', 'bun/1.1.27 npm/? node/v22.6.0 darwin arm64')
    await createWebdriverIO({ npmTag: 'latest' } as ProgramOpts)
    expect(runProgram).toBeCalledWith(
        'bun',
        ['install', '@wdio/cli@latest'],
        expect.any(Object)
    )
    expect(runProgram).toBeCalledWith(
        'bunx',
        ['wdio', 'config', '--npm-tag', 'latest'],
        expect.any(Object),
        true
    )
    expect(runProgram).toBeCalledTimes(2)
    expect(fs.mkdir).toBeCalledTimes(0)
    expect(fs.writeFile).toBeCalledTimes(0)
})

test('createWebdriverIO with dev true installs @wdio/cli as a devDependency', async () => {
    vi.stubEnv('npm_config_user_agent', 'npm/10.2.4 node/v20.11.0 darwin arm64 workspaces/false')
    await createWebdriverIO({ npmTag: 'latest', dev: true } as ProgramOpts)
    expect(runProgram).toBeCalledWith(
        'npm',
        ['install', '--save-dev', '@wdio/cli@latest'],
        expect.any(Object)
    )
    expect(runProgram).toBeCalledWith(
        'npx',
        ['wdio', 'config', '--npm-tag', 'latest'],
        expect.any(Object),
        true
    )
    expect(runProgram).toBeCalledTimes(2)
    expect(fs.mkdir).toBeCalledTimes(0)
    expect(fs.writeFile).toBeCalledTimes(0)
})

test('does not install the @wdio/cli package when the @wdio/cli package is already installed in the current project', async () => {
    vi.stubEnv('npm_config_user_agent', 'npm/10.2.4 node/v20.11.0 darwin arm64 workspaces/false')
    vi.mocked(resolve).mockReturnValue('/Users/user/dev/my-monorepo/package.json')
    await createWebdriverIO({ npmTag: 'latest' } as ProgramOpts)
    expect(runProgram).toBeCalledWith(
        'npx',
        ['wdio', 'config', '--npm-tag', 'latest'],
        expect.any(Object),
        true
    )
    expect(runProgram).toBeCalledTimes(1)
    expect(fs.mkdir).toBeCalledTimes(0)
    expect(fs.writeFile).toBeCalledTimes(0)
})

test('does not install the @wdio/cli package when the @wdio/cli package is already installed globally', async () => {
    vi.stubEnv('npm_config_user_agent', 'npm/10.2.4 node/v20.11.0 darwin arm64 workspaces/false')
    vi.mocked(execSync).mockReturnValue(`
    ├── @wdio/cli@8.24.3
    ├── corepack@0.20.0
    ├── npm@10.2.0
    └── yarn@1.22.19
    `)
    await createWebdriverIO({ npmTag: 'latest' } as ProgramOpts)
    expect(runProgram).toBeCalledWith(
        'npx',
        ['wdio', 'config', '--npm-tag', 'latest'],
        expect.any(Object),
        true
    )
    expect(runProgram).toBeCalledTimes(1)
    expect(fs.mkdir).toBeCalledTimes(0)
    expect(fs.writeFile).toBeCalledTimes(0)
})

test('runs the wdio config command with --yes when the yes option is set to true', async () => {
    vi.stubEnv('npm_config_user_agent', 'npm/10.2.4 node/v20.11.0 darwin arm64 workspaces/false')
    await createWebdriverIO({ npmTag: 'latest', yes: true } as ProgramOpts)
    expect(runProgram).toBeCalledWith(
        'npm',
        ['install', '@wdio/cli@latest'],
        expect.any(Object)
    )
    expect(runProgram).toBeCalledWith(
        'npx',
        ['wdio', 'config', '--yes', '--npm-tag', 'latest'],
        expect.any(Object),
        true
    )
    expect(runProgram).toBeCalledTimes(2)
    expect(fs.mkdir).toBeCalledTimes(0)
    expect(fs.writeFile).toBeCalledTimes(0)
})

test('forwards wizard answers to the wdio config command', async () => {
    vi.stubEnv('npm_config_user_agent', 'npm/10.2.4 node/v20.11.0 darwin arm64 workspaces/false')
    await createWebdriverIO({
        npmTag: 'latest',
        yes: true,
        framework: 'cucumber',
        typescript: false,
        reporters: 'spec,junit'
    } as ProgramOpts)
    expect(runProgram).toBeCalledWith(
        'npx',
        ['wdio', 'config', '--yes', '--npm-tag', 'latest', '--framework', 'cucumber', '--no-typescript', '--reporters', 'spec,junit'],
        expect.any(Object),
        true
    )
})

test('exits on an invalid wizard answer before installing anything', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any)
    await createWebdriverIO({ npmTag: 'latest', framework: 'cucumbr' } as ProgramOpts)
    expect(consoleError).toBeCalledWith(expect.stringContaining('Invalid value "cucumbr" for --framework'))
    expect(exit).toBeCalledWith(2)
    expect(runProgram).toBeCalledTimes(0)
    consoleError.mockRestore()
    exit.mockRestore()
})

test('does create a package.json to be used by the wdio config command when one does not exist', async () => {
    vi.stubEnv('npm_config_user_agent', 'npm/10.2.4 node/v20.11.0 darwin arm64 workspaces/false')
    vi.mocked(fs.access).mockRejectedValue(new Error('not existing'))
    await createWebdriverIO({ npmTag: 'next' } as ProgramOpts)
    expect(runProgram).toBeCalledWith(
        'npm',
        ['install', '@wdio/cli@next'],
        expect.any(Object)
    )
    expect(runProgram).toBeCalledWith(
        'npx',
        ['wdio', 'config', '--npm-tag', 'next'],
        expect.any(Object),
        true
    )
    expect(runProgram).toBeCalledTimes(2)
    expect(fs.mkdir).toBeCalledTimes(1)
    expect(fs.writeFile).toBeCalledTimes(1)
    expect(fs.writeFile).toBeCalledWith(
        expect.any(String),
        JSON.stringify({ name: 'someProjectName', type: 'module' }, null, 2),
    )
})

test('installs the next version when the npmTag option is set to "next"', async () => {
    vi.stubEnv('npm_config_user_agent', 'npm/10.2.4 node/v20.11.0 darwin arm64 workspaces/false')
    await createWebdriverIO({ npmTag: 'next' } as ProgramOpts)
    expect(runProgram).toBeCalledWith(
        'npm',
        ['install', '@wdio/cli@next'],
        expect.any(Object)
    )
    expect(runProgram).toBeCalledWith(
        'npx',
        ['wdio', 'config', '--npm-tag', 'next'],
        expect.any(Object),
        true
    )
    expect(runProgram).toBeCalledTimes(2)
    expect(fs.mkdir).toBeCalledTimes(0)
    expect(fs.writeFile).toBeCalledTimes(0)
})

afterEach(() => {
    vi.mocked(fs.access).mockClear()
    vi.mocked(fs.mkdir).mockClear()
    vi.mocked(fs.writeFile).mockClear()
    vi.mocked(runProgram).mockClear()
    vi.mocked(resolve).mockClear()
    vi.mocked(execSync).mockClear()
    console.log = consoleLog
})

vi.mock('execa', () => ({
    execa: vi.fn().mockResolvedValue({ stdout: 'foo', stderr: 'bar', exitCode: 0 })
}))

vi.mock('detect', () => ({
    detect: vi.fn().mockResolvedValue('pnpm')
}))

describe('install', () => {
    it('installPackages passing', async () => {
        expect(await installPackages('/foo/bar', ['foo', 'bar'], true))
            .toBe(true)
    })

    it('installPackages failing', async () => {
        // like execa: a failed command rejects unless `reject: false` is set
        vi.mocked(execa).mockImplementationOnce(((_: string, __: string[], options: { reject?: boolean }) => options.reject === false
            ? Promise.resolve({ exitCode: 1, failed: true, stdout: 'added 0 packages', stderr: [
                'npm warn deprecated foo',
                'npm error code ERESOLVE',
                'npm error peer appium@"^4.0.0-beta.6" from appium-xcuitest-driver@13.0.8'
            ].join('\n') })
            : Promise.reject(new Error('Command failed with exit code 1: npm install'))) as any)
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
        try {
            expect(await installPackages('/foo/bar', ['foo', 'bar'], false)).toBe(false)
            const message = consoleError.mock.calls.flat().join('\n')
            expect(message).toContain('npm error code ERESOLVE')
            expect(message).toContain('npm error peer appium@"^4.0.0-beta.6" from appium-xcuitest-driver@13.0.8')
            expect(message).not.toContain('npm warn deprecated foo')
            expect(message).toMatch(/run the wizard again\. To check the install alone, run:\n\S+ (install|add) foo bar/)
        } finally {
            consoleError.mockRestore()
        }
    })

    it('installPackages shows the output while it runs and keeps it for the error', async () => {
        vi.mocked(execa).mockClear().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 } as any)
        await installPackages('/foo/bar', ['foo'], true)
        expect(vi.mocked(execa).mock.calls[0][2]).toMatchObject({
            reject: false,
            stdout: ['inherit', 'pipe'],
            stderr: ['inherit', 'pipe']
        })
    })

    it('getInstallCommand', () => {
        expect(getInstallCommand('pnpm', ['foo', 'bar'], true))
            .toBe('pnpm add foo bar --save-dev')
    })
})
