import fs from 'node:fs/promises'
import { vi, test, expect, beforeEach, afterEach, describe, it } from 'vitest'
import ejs from 'ejs'
import { $ } from 'execa'
import { runProgram, getPackageVersion,

    convertPackageHashToObject,
    generateTestFiles,
    getPathForFileGeneration,
    getDefaultFiles,
    getProjectRoot,
    getAnswers,
    getProjectProps,
    createPackageJSON,
    npmInstall,
    setupTypeScript,
    createWDIOConfig,
    runAppiumInstaller,
    detectCompiler,
    findInConfig,
    replaceConfig,
    formatConfigFilePaths,

} from '../src/utils.js'
import { parseAnswers } from '../src/cli/utils.js'
import path from 'node:path'
import { readPackageUp } from 'read-pkg-up'
import type { Questionnair } from '../src/types.js'
import inquirer from 'inquirer'
import { installPackages } from '../src/install.js'

const consoleLog = console.log.bind(console)
const processExit = process.exit.bind(process)

vi.mock('node:fs/promises', () => ({
    default: {
        access: vi.fn().mockRejectedValue(new Error('ENOENT')),
        mkdir: vi.fn(),
        readdir: vi.fn(),
        readFile: vi.fn(),
        writeFile: vi.fn().mockReturnValue(Promise.resolve())
    }
}))
vi.mock('child_process', () => {
    const m = {
        execSyncRes: 'APPIUM_MISSING',
        execSync: () => m.execSyncRes,
        exec: vi.fn(),
        spawn: vi.fn().mockReturnValue({ on: vi.fn().mockImplementation((ev, fn) => fn(0)) })
    }
    return m
})
vi.mock('inquirer')
vi.mock('read-pkg-up')
vi.mock('ejs')
vi.mock('execa', () => ({
    execa: vi.fn(()=>({ stdout:'', stderr:'', exitCode:0 })),
    $: vi.fn().mockReturnValue(async (sh: string) => sh)
}))
vi.mock('../src/install.js', () => ({
    installPackages: vi.fn(),
    getInstallCommand: vi.fn().mockReturnValue('npm install foo bar --save-dev')
}))

beforeEach(() => {
    process.exit = vi.fn() as any
    console.log = vi.fn()
    vi.mocked(readPackageUp).mockResolvedValue({
        path: '/foo/package.json',
        packageJson: {
            name: 'cool-test-module',
            type: 'module'
        }
    })
})
afterEach(() => {
    process.exit = processExit
    console.log = consoleLog
})

test('runProgram', async () => {
    expect(await runProgram('echo', ['123'], {})).toBe(undefined)

    await runProgram('node', ['-e', 'throw new Error(\'ups\')'], {}).catch((e) => e)
    expect(vi.mocked(console.log).mock.calls[0][0]).toMatch(/Error calling: node -e throw new Error/)
    expect(process.exit).toBeCalledTimes(1)

    await runProgram('foobarloo', [], {}).catch((e) => e)

    expect(vi.mocked(console.log).mock.calls[1][0]).toMatch(/spawn foobarloo (ENOENT|EACCES)/)
    expect(process.exit).toBeCalledTimes(2)
})

test('getPackageVersion prefixes the version from package.json', async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify({ version: '1.2.3' }) as any)
    expect(await getPackageVersion()).toBe('v1.2.3')
})

describe('convertPackageHashToObject', () => {
    it('works with default `$--$` hash', () => {
        expect(convertPackageHashToObject('test/package-name$--$package-name')).toMatchObject({
            package: 'test/package-name',
            short: 'package-name'
        })
    })

    it('works with custom hash', () => {
        expect(convertPackageHashToObject('test/package-name##-##package-name', '##-##')).toMatchObject({
            package: 'test/package-name',
            short: 'package-name'
        })
    })
})

/**
 * `fs.readdir(dir, { recursive: true, withFileTypes: true })` result
 */
const listing = (files: string[]) => files.map((file) => ({
    name: path.basename(file),
    parentPath: path.dirname(file),
    isFile: () => true
})) as any

describe('generateTestFiles', () => {
    it('Mocha with page objects', async () => {
        vi.mocked(fs.readdir).mockResolvedValue(listing([
            '/foo/bar/loo/page.js.ejs',
            '/foo/bar/example.e2e.js.ejs',
            '/foo/bar/README.md'
        ]))
        const answers = {
            runner: 'local',
            framework: 'mocha',
            usePageObjects: true,
            generateTestFiles: true,
            destPageObjectRootPath: '/tests/page/objects/model',
            destSpecRootPath: '/tests/specs'
        }

        await generateTestFiles(answers as any)

        expect(fs.readdir).toBeCalledTimes(2)
        expect(fs.readdir).toHaveBeenNthCalledWith(1, expect.stringContaining('mocha'), { recursive: true, withFileTypes: true })
        expect(fs.readdir).toHaveBeenNthCalledWith(2, expect.stringContaining('pageobjects'), { recursive: true, withFileTypes: true })

        expect(ejs.renderFile).toBeCalledTimes(4)
        expect(ejs.renderFile).toBeCalledWith(
            path.join('/foo/bar/loo/page.js.ejs'),
            { answers },
            expect.any(Function)
        )
        expect(ejs.renderFile).toBeCalledWith(
            path.join('/foo/bar/example.e2e.js.ejs'),
            { answers },
            expect.any(Function)
        )
        expect(fs.mkdir).toBeCalledTimes(4)
        expect((vi.mocked(fs.writeFile).mock.calls[0][0] as string)
            .endsWith(`${path.sep}page${path.sep}objects${path.sep}model${path.sep}page.js`))
            .toBe(true)
        expect((vi.mocked(fs.writeFile).mock.calls[1][0] as string)
            .endsWith(`${path.sep}example.e2e.js`))
            .toBe(true)
    })

    it('jasmine with page objects', async () => {
        const answers = {
            runner: 'local',
            framework: 'jasmine',
            usePageObjects: true,
            generateTestFiles: true,
            destPageObjectRootPath: '/tests/page/objects/model',
            destSpecRootPath: '/tests/specs'
        }

        await generateTestFiles(answers as any)

        expect(fs.readdir).toBeCalledTimes(2)
        expect(fs.readdir).toHaveBeenNthCalledWith(1, expect.stringContaining('mochaJasmine'), { recursive: true, withFileTypes: true })
        expect(fs.readdir).toHaveBeenNthCalledWith(2, expect.stringContaining('pageobjects'), { recursive: true, withFileTypes: true })

        expect(ejs.renderFile).toBeCalledTimes(4)
        expect(ejs.renderFile).toBeCalledWith(
            path.join('/foo/bar/loo/page.js.ejs'),
            { answers },
            expect.any(Function)
        )
        expect(ejs.renderFile).toBeCalledWith(
            path.join('/foo/bar/example.e2e.js.ejs'),
            { answers },
            expect.any(Function)
        )
        expect(fs.mkdir).toBeCalledTimes(4)
        expect((vi.mocked(fs.writeFile).mock.calls[0][0] as string)
            .endsWith(`${path.sep}page${path.sep}objects${path.sep}model${path.sep}page.js`))
            .toBe(true)
        expect((vi.mocked(fs.writeFile).mock.calls[1][0] as string)
            .endsWith(`${path.sep}example.e2e.js`))
            .toBe(true)
    })

    it('Cucumber without page objects', async () => {
        vi.mocked(fs.readdir).mockResolvedValue(listing([
            '/foo/bar/loo/step_definition/example.step.js.ejs',
            '/foo/bar/example.feature'
        ]))
        const answers = {
            runner: 'local',
            specs: './tests/e2e/*.js',
            framework: 'cucumber',
            stepDefinitions: '/some/step/defs',
            usePageObjects: false,
            generateTestFiles: true,
            destSpecRootPath: '/tests/specs',
            destStepRootPath: '/tests/stepDefinitions'
        }
        await generateTestFiles(answers as any)

        expect(fs.readdir).toBeCalledTimes(1)
        expect(fs.readdir).toHaveBeenNthCalledWith(1, expect.stringContaining('cucumber'), { recursive: true, withFileTypes: true })
        expect(ejs.renderFile).toBeCalledTimes(2)
        expect(ejs.renderFile).toBeCalledWith(
            path.join('/foo/bar/loo/step_definition/example.step.js.ejs'),
            { answers },
            expect.any(Function)
        )
        expect(ejs.renderFile).toBeCalledWith(
            path.join('/foo/bar/example.feature'),
            { answers },
            expect.any(Function)
        )
        expect(fs.mkdir).toBeCalledTimes(2)
    })

    it('Cucumber with page objects and TypeScript', async () => {
        vi.mocked(fs.readdir).mockResolvedValue(listing([
            '/foo/bar/loo/page.js.ejs',
            '/foo/bar/loo/step_definition/example.step.js.ejs',
            '/foo/bar/example.feature'
        ]))
        const answers = {
            runner: 'local',
            framework: 'cucumber',
            usePageObjects: true,
            isUsingTypeScript: true,
            destStepRootPath: '/tests/stepDefinitions',
            destSpecRootPath: '/tests/specs',
            destPageObjectRootPath: '/some/page/objects',
            relativePath: '../page/object'
        }
        await generateTestFiles(answers as any)

        expect(fs.readdir).toBeCalledTimes(2)
        expect(fs.readdir).toHaveBeenNthCalledWith(1, expect.stringContaining('cucumber'), { recursive: true, withFileTypes: true })
        expect(ejs.renderFile).toBeCalledTimes(6)
        expect(ejs.renderFile).toBeCalledWith(
            path.join('/foo/bar/loo/step_definition/example.step.js.ejs'),
            { answers },
            expect.any(Function)
        )
        expect(ejs.renderFile).toBeCalledWith(
            path.join('/foo/bar/example.feature'),
            { answers },
            expect.any(Function)
        )
        expect(fs.mkdir).toBeCalledTimes(6)
        expect(
            (vi.mocked(fs.writeFile).mock.calls[0][0] as string)
                .endsWith(`${path.sep}some${path.sep}page${path.sep}objects${path.sep}page.ts`)
        ).toBe(true)
        expect(
            (vi.mocked(fs.writeFile).mock.calls[2][0] as string)
                .endsWith(`${path.sep}example.feature`)
        ).toBe(true)
    })

})

describe('findInConfig', () => {
    it('finds text for services', () => {
        const str = "services: ['foo', 'bar'],"

        expect(findInConfig(str, 'service')).toMatchObject([
            'services: [\'foo\', \'bar\']'
        ])
    })

    it('finds text for frameworks', () => {
        const str = "framework: 'mocha'"

        expect(findInConfig(str, 'framework')).toMatchObject([
            "framework: 'mocha'"
        ])
    })
})

describe('formatConfigFilePaths', () => {
    it('should format properly', async () => {

        expect(await formatConfigFilePaths('/path/to/foo.js')).toMatchObject({
            fullPath:'/path/to/foo.js',
            fullPathNoExtension:'/path/to/foo'
        })
    })
})

describe('replaceConfig', () => {
    it('correctly changes framework', () => {
        const fakeConfig = `exports.config = {
    runner: 'local',
    specs: [
        './test/specs/**/*.js'
    ],
    framework: 'mocha',
}`

        expect(replaceConfig(fakeConfig, 'framework', 'jasmine')).toBe(
            `exports.config = {
    runner: 'local',
    specs: [
        './test/specs/**/*.js'
    ],
    framework: 'jasmine',
}`
        )
    })

    it('correctly changes service', () => {
        const fakeConfig = `exports.config = {
    runner: 'local',
    specs: [
        './test/specs/**/*.js'
    ],
    services: [],
    framework: 'mocha',
}`
        expect(replaceConfig(fakeConfig, 'service', 'sauce')).toBe(
            `exports.config = {
    runner: 'local',
    specs: [
        './test/specs/**/*.js'
    ],
    services: ['sauce'],
    framework: 'mocha',
}`
        )
    })
})

describe('getPathForFileGeneration', () => {
    it('Cucumber with pageobjects default values', () => {
        const generatedPaths = getPathForFileGeneration({
            runner: 'local',
            stepDefinitions: './features/step-definitions/steps.js',
            pages: './features/pageobjects/**/*.js',
            generateTestFiles: true,
            usePageObjects: true,
            framework: '@wdio/cucumber-service$--$cucumber'
        } as any, '/foo/bar')
        expect(generatedPaths.relativePath).toEqual('../pageobjects')
    })

    it('Cucumber with pageobjects default different path', () => {
        const generatedPaths = getPathForFileGeneration({
            runner: 'local',
            stepDefinitions: './features/step-definitions/steps.js',
            pages: './features/page/objects/**/*.js',
            generateTestFiles: true,
            usePageObjects: true,
            framework: '@wdio/cucumber-service$--$cucumber'
        } as any, '/foo/bar')
        expect(generatedPaths.relativePath).toEqual('../page/objects')
    })
    it('Cucumber with pageobjects and steps different path', () => {
        const generatedPaths = getPathForFileGeneration({
            runner: 'local',
            stepDefinitions: 'cucumber/features/steps',
            pages: 'cucumber/features/pages',
            generateTestFiles: true,
            usePageObjects: true,
            framework: '@wdio/cucumber-service$--$cucumber'
        } as any, '/foo/bar')
        expect(generatedPaths.relativePath).toEqual('')
    })

    it('Cucumber with answer that is not a path', () => {
        const generatedPaths = getPathForFileGeneration({
            runner: 'local',
            stepDefinitions: 'y',
            pages: 'h',
            generateTestFiles: true,
            usePageObjects: true,
            framework: '@wdio/cucumber-service$--$cucumber'
        } as any, '/foo/bar')
        expect(generatedPaths.relativePath).toEqual('../h')
    })

    it('Mocha with pageobjects default values', () => {
        const generatedPaths = getPathForFileGeneration({
            runner: 'local',
            specs: './test/specs/**/*.js',
            pages: './test/pageobjects/**/*.js',
            generateTestFiles: true,
            usePageObjects: true,
            framework: '@wdio/cucumber-service$--$mocha'
        } as any, '/foo/bar')
        expect(generatedPaths.relativePath).toEqual('../pageobjects')
    })

    it('Mocha with pageobjects different path', () => {
        const generatedPaths = getPathForFileGeneration({
            runner: 'local',
            specs: './test/specs/files/**/*.js',
            pages: './test/pageobjects/**/*.js',
            generateTestFiles: true,
            usePageObjects: true,
            framework: '@wdio/cucumber-service$--$mocha'
        } as any, '/foo/bar')
        expect(generatedPaths.relativePath).toEqual('../../pageobjects')
    })

    it('Do not auto generate file', () => {
        const generatedPaths = getPathForFileGeneration({
            runner: 'local',
            specs: './test/specs/files/**/*.js',
            pages: './test/pageobjects/**/*.js',
            generateTestFiles: false,
            usePageObjects: true,
            framework: '@wdio/cucumber-service$--$mocha'
        } as any, '/foo/bar')
        expect(generatedPaths.relativePath).toEqual('')
    })

    it('Do not use PageObjects', () => {
        const generatedPaths = getPathForFileGeneration({
            runner: 'local',
            specs: './test/specs/files/**/*.js',
            pages: './test/pageobjects/**/*.js',
            generateTestFiles: true,
            usePageObjects: false,
            framework: '@wdio/cucumber-service$--$mocha'
        } as any, '/foo/bar')
        expect(generatedPaths.relativePath).toEqual('')
    })
})

test('getDefaultFiles', async () => {
    const files = '/foo/bar'
    expect(await getDefaultFiles({ projectRootCorrect: false, projectRoot: '/bar', isUsingTypeScript: true } as any, files))
        .toBe(path.join('/bar', 'foo', 'bar.ts'))
    expect(await getDefaultFiles({ projectRootCorrect: false, projectRoot: '/bar', isUsingTypeScript: true, preset: 'vite-plugin-solid$--$solid' } as any, files))
        .toBe(path.join('/bar', 'foo', 'bar.tsx'))
    expect(await getDefaultFiles({ projectRootCorrect: false, projectRoot: '/bar', isUsingTypeScript: false } as any, files))
        .toBe(path.join('/bar', 'foo', 'bar.js'))
})

test('original implementation of getDefaultFiles handles projectRoot with no package.json', async () => {
    const files = '/foo/bar'
    vi.mocked(readPackageUp).mockRestore()
    expect(await getDefaultFiles({ createPackageJSON: true, projectRoot: '/project-root-with-no-package.json', isUsingTypeScript: false } as any, files))
        .toBe(path.join('/project-root-with-no-package.json', 'foo', 'bar.js'))
})

test('getProjectRoot', async () => {
    expect(await getProjectRoot()).toBe('/foo')
    expect(await getProjectRoot({
        projectRootCorrect: true
    } as any)).toBe('/foo')
    expect(await getProjectRoot({
        projectRootCorrect: false,
        projectRoot: '/bar/foo'
    } as any)).toBe('/bar/foo')
})

test('detectCompiler', async () => {
    vi.mocked(readPackageUp).mockRestore()
    const answers = { createPackageJSON: true } as Questionnair
    expect(await detectCompiler(answers)).toBe(false)
})

test('getAnswers', async () => {
    let answers = await getAnswers(true)
    delete answers.pages // delete so it doesn't fail in Windows
    delete answers.specs // delete so it doesn't fail in Windows
    expect(answers).toMatchSnapshot()
    vi.mocked(inquirer.prompt).mockReturnValue('some value' as any)
    answers = await getAnswers(false)
    delete answers.pages // delete so it doesn't fail in Windows
    delete answers.specs // delete so it doesn't fail in Windows
    expect(answers).toBe('some value')
    expect(inquirer.prompt).toBeCalledTimes(2)
    // @ts-ignore
    expect(vi.mocked(inquirer.prompt).mock.calls[0][0][0].when).toBe(false)
    vi.mocked(readPackageUp).mockResolvedValue(undefined)
    vi.mocked(inquirer.prompt).mockClear()
    expect(await getAnswers(false)).toBe('some value')
    expect(inquirer.prompt).toBeCalledTimes(2)
    // @ts-ignore
    expect(vi.mocked(inquirer.prompt).mock.calls[0][0][0].when).toBe(true)
})

test('getAnswers with --yes keeps answers given as flags', async () => {
    const answers = await getAnswers(true, {
        framework: '@wdio/cucumber-framework$--$cucumber',
        isUsingTypeScript: false,
        reporters: ['@wdio/dot-reporter$--$dot'],
        browserEnvironment: ['firefox'],
        e2eEnvironment: 'web'
    })
    expect(answers.framework).toBe('@wdio/cucumber-framework$--$cucumber')
    expect(answers.isUsingTypeScript).toBe(false)
    expect(answers.reporters).toEqual(['@wdio/dot-reporter$--$dot'])
    expect(answers.browserEnvironment).toEqual(['firefox'])
    // defaults still apply to the questions that weren't answered
    expect(answers.runner).toBe('@wdio/local-runner$--$local$--$e2e')
    expect(answers.stepDefinitions).toContain('step-definitions')
    expect(answers.usePageObjects).toBe(true)
})

test('getAnswers with --yes leaves free text questions without a default unanswered', async () => {
    for (const [desktopFramework, pathAnswer] of [
        ['Tauri (https://tauri.app/)', 'tauriAppBinaryPath'],
        ['Dioxus (https://dioxuslabs.com/)', 'dioxusAppBinaryPath']
    ] as const) {
        const answers = await getAnswers(true, {
            runner: '@wdio/local-runner$--$local$--$desktop',
            desktopFramework: desktopFramework as Questionnair['desktopFramework']
        })
        expect(answers).not.toHaveProperty(pathAnswer)
    }
    const answers = await getAnswers(true, { backend: 'In the cloud using Testingbot or LambdaTest or a different service' as Questionnair['backend'] })
    expect(answers).not.toHaveProperty('hostname')
    expect(answers.port).toBe('80')
})

test('getAnswers with --yes rejects a flag that does not apply', async () => {
    await expect(getAnswers(true, { preset: '@vitejs/plugin-react$--$react' }))
        .rejects.toThrow('--preset does not apply to this setup')
})

test('getAnswers passes flag answers to the wizard', async () => {
    vi.mocked(inquirer.prompt).mockImplementation((async (_: unknown, answers: object) => ({
        ...answers,
        runner: '@wdio/local-runner$--$local$--$e2e',
        backend: 'On my local machine',
        reporters: [],
        plugins: [],
        services: []
    })) as any)
    const answers = await getAnswers(false, { framework: '@wdio/jasmine-framework$--$jasmine' })
    expect(vi.mocked(inquirer.prompt).mock.calls[1][1]).toEqual(expect.objectContaining({
        framework: '@wdio/jasmine-framework$--$jasmine'
    }))
    expect(answers.framework).toBe('@wdio/jasmine-framework$--$jasmine')
})

test('getProjectProps', async () => {
    vi.mocked(readPackageUp).mockResolvedValue(undefined)
    expect(await getProjectProps('/foo/bar')).toBe(undefined)
    expect(readPackageUp).toBeCalledWith({ cwd: '/foo/bar' })
    vi.mocked(readPackageUp).mockResolvedValue({
        path: '/foo/bar',
        packageJson: {
            name: 'cool-test-module2',
        }
    })
    expect(await getProjectProps('/foo/bar')).toEqual({
        esmSupported: false,
        packageJson: { name: 'cool-test-module2' },
        path: '/foo'
    })
})

test('createPackageJSON', async () => {
    await createPackageJSON({} as any)
    expect(fs.writeFile).toBeCalledTimes(0)
    await createPackageJSON({
        createPackageJSON: true
    } as any)
    expect(console.log).toBeCalledTimes(2)
})

test('npmInstall', async () => {
    const parsedAnswers = {
        rawAnswers: {
            services: ['foo$--$bar'],
            preset: 'barfoo$--$vue'
        },
        projectRootCorrect: false,
        projectRoot: '/foo/bar',
        isUsingTypeScript: true,
        framework: 'jasmine',
        installTestingLibrary: true,
        packagesToInstall: ['foo$--$bar', 'bar$--$foo'],
        npmInstall: true,
        includeVisualTesting: true
    } as any
    await npmInstall(parsedAnswers, 'next')
    expect(installPackages).toBeCalledTimes(1)
    expect(vi.mocked(installPackages).mock.calls).toMatchSnapshot()
})

test('not npmInstall', async () => {
    const parsedAnswers = {
        rawAnswers: {
            services: ['foo$--$bar'],
            preset: 'barfoo$--$vue'
        },
        installTestingLibrary: true,
        packagesToInstall: ['foo$--$bar', 'bar$--$foo'],
        npmInstall: false
    } as any
    await npmInstall(parsedAnswers, 'next')
    expect(installPackages).toBeCalledTimes(0)
    expect(vi.mocked(console.log).mock.calls[0][0]).toContain('To install dependencies, execute')
})

test('setupTypeScript', async () => {
    await setupTypeScript({} as any)
    expect(fs.writeFile).toBeCalledTimes(0)
    const parsedAnswers = {
        isUsingTypeScript: true,
        esmSupport: true,
        rawAnswers: {
            framework: 'foo',
            services: [
                'wdio-foobar-service$--$foobar',
                '@wdio/electron-service$--$electron'
            ]
        },
        packagesToInstall: [],
        tsConfigFilePath: '/foobar/tsconfig.json',
        projectRootDir: '/foobar'
    } as any
    await setupTypeScript(parsedAnswers)
    expect(vi.mocked(fs.writeFile).mock.calls[0][1]).toMatchSnapshot()
})

test('setupTypeScript uses NodeNext for a CommonJS project', async () => {
    vi.mocked(fs.writeFile).mockClear()
    await setupTypeScript({
        isUsingTypeScript: true,
        esmSupport: false,
        rawAnswers: { framework: 'foo', services: [] },
        packagesToInstall: [],
        tsConfigFilePath: '/foobar/tsconfig.json',
        projectRootDir: '/foobar'
    } as any)
    const { compilerOptions } = JSON.parse(vi.mocked(fs.writeFile).mock.calls[0][1] as string)
    expect(compilerOptions.module).toBe('NodeNext')
    expect(compilerOptions.moduleResolution).toBe('NodeNext')
})

test('setupTypeScript does not create tsconfig.json if TypeScript was not selected', async () => {
    const parsedAnswers = {
        isUsingTypeScript: false,
        esmSupport: true,
        rawAnswers: {
            framework: 'foo',
            services: [
                'wdio-foobar-service$--$foobar',
                '@wdio/electron-service$--$electron'
            ]
        },
        packagesToInstall: [],
        tsConfigFilePath: '/foobar/tsconfig.json',
        projectRootDir: '/foobar'
    } as any
    await setupTypeScript(parsedAnswers)
    expect(fs.writeFile).not.toBeCalled()
    expect(parsedAnswers.packagesToInstall).toEqual([])
})

test('setupTypeScript creates a dedicated tsconfig even if there is already one', async () => {
    const parsedAnswers = {
        isUsingTypeScript: true,
        esmSupport: true,
        rawAnswers: {
            framework: 'foo',
            services: [
                'wdio-foobar-service$--$foobar',
                '@wdio/electron-service$--$electron'
            ]
        },
        packagesToInstall: [],
        tsConfigFilePath: '/foobar/tsconfig.e2e.json',
        hasRootTSConfig: true,
        projectRootDir: '/foobar'
    } as any
    await setupTypeScript(parsedAnswers)
    const writtenContent = vi.mocked(fs.writeFile).mock.calls[0][1] as string
    expect(writtenContent).toContain('"extends": "./tsconfig.json"')
    expect(writtenContent).not.toContain('"extends": "tsconfig.json"')
    expect(vi.mocked(fs.writeFile).mock.calls[0][0]).toBe('/foobar/tsconfig.e2e.json')
    expect(writtenContent).toMatchSnapshot()
})

test('setupTypeScript extends the root config with a relative path from a nested directory', async () => {
    const parsedAnswers = {
        isUsingTypeScript: true,
        esmSupport: true,
        rawAnswers: {
            framework: 'foo',
            services: []
        },
        packagesToInstall: [],
        tsConfigFilePath: '/foobar/test/tsconfig.json',
        hasRootTSConfig: true,
        projectRootDir: '/foobar',
        destSpecRootPath: '/foobar/test'
    } as any
    await setupTypeScript(parsedAnswers)
    const writtenContent = JSON.parse(vi.mocked(fs.writeFile).mock.calls[0][1] as string)
    expect(writtenContent.extends).toBe('../tsconfig.json')
    expect(writtenContent.include).toEqual(['.', '../wdio.conf.ts'])
})

test('createWDIOConfig', async () => {
    const answers = await parseAnswers(true)
    answers.destSpecRootPath = '/tests/specs'
    answers.destPageObjectRootPath = '/tests/specs'
    answers.stepDefinitions = './foo/bar'
    answers.specs = '/foo/bar/**'
    await createWDIOConfig(answers as any)
    expect(fs.writeFile).toBeCalledTimes(7)
    expect(
        vi.mocked(fs.writeFile).mock.calls[0][0]
            .toString()
            .endsWith(path.resolve('wdio.conf.js'))
    ).toBe(true)
})

test('runAppiumInstaller', async () => {
    const isTTY = process.stdin.isTTY
    process.stdin.isTTY = true
    expect(await runAppiumInstaller({ e2eEnvironment: 'web' } as any))
        .toBe(undefined)
    expect(console.log).toBeCalledTimes(0)
    expect($).toBeCalledTimes(0)

    vi.mocked(inquirer.prompt).mockResolvedValue({
        continueWithAppiumSetup: false
    })

    expect(await runAppiumInstaller({ e2eEnvironment: 'mobile' } as any))
        .toBe(undefined)
    expect(console.log).toBeCalledTimes(1)
    expect($).toBeCalledTimes(0)

    vi.mocked(inquirer.prompt).mockResolvedValue({
        continueWithAppiumSetup: true
    })
    expect(await runAppiumInstaller({ e2eEnvironment: 'mobile' } as any))
        .toEqual(['npx appium-installer'])
    expect($).toBeCalledTimes(1)
    process.stdin.isTTY = isTTY
})

test('runAppiumInstaller skips the installer without a terminal', async () => {
    const isTTY = process.stdin.isTTY
    process.stdin.isTTY = false
    expect(await runAppiumInstaller({ e2eEnvironment: 'mobile' } as any))
        .toBe(undefined)
    expect(inquirer.prompt).toBeCalledTimes(0)
    expect($).toBeCalledTimes(0)
    expect(console.log).toBeCalledWith(expect.stringContaining('npx appium-installer'))
    process.stdin.isTTY = isTTY
})
afterEach(()=>{
    vi.mocked(inquirer.prompt).mockClear()
    vi.mocked(fs.readdir).mockClear()
    vi.mocked(ejs.renderFile).mockClear()
    vi.mocked(fs.writeFile).mockClear()
    vi.mocked(fs.mkdir).mockClear()
    vi.mocked(installPackages).mockClear()
})
