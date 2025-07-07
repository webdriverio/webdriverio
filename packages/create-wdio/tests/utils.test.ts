import fs from 'node:fs/promises'
import * as cp from 'node:child_process'
import { vi, test, expect, beforeEach, afterEach, describe, it } from 'vitest'
import readDir from 'recursive-readdir'
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
    createWDIOScript,
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
import { installPackages } from '../src/cli/install.js'

const consoleLog = console.log.bind(console)
const processExit = process.exit.bind(process)

vi.mock('node:fs/promises', () => ({
    default: {
        access: vi.fn().mockRejectedValue(new Error('ENOENT')),
        mkdir: vi.fn(),
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
vi.mock('recursive-readdir', () => ({
    default: vi.fn().mockResolvedValue([
        '/foo/bar/loo/page.js.ejs',
        '/foo/bar/example.e2e.js'
    ] as any)
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

    expect(vi.mocked(console.log).mock.calls[1][0]).toMatch(/spawn foobarloo ENOENT/)
    expect(process.exit).toBeCalledTimes(2)
})

test('getPackageVersion', async () => {
    expect(await getPackageVersion()).toEqual(expect.any(String))
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

describe('generateTestFiles', () => {
    it('Mocha with page objects', async () => {
        vi.mocked(readDir).mockResolvedValue([
            '/foo/bar/loo/page.js.ejs',
            '/foo/bar/example.e2e.js'
        ] as any)
        const answers = {
            runner: 'local',
            framework: 'mocha',
            usePageObjects: true,
            generateTestFiles: true,
            destPageObjectRootPath: '/tests/page/objects/model',
            destSpecRootPath: '/tests/specs'
        }

        await generateTestFiles(answers as any)

        expect(readDir).toBeCalledTimes(2)
        expect(vi.mocked(readDir).mock.calls[0][0]).toContain('mocha')
        expect(vi.mocked(readDir).mock.calls[1][0]).toContain('pageobjects')

        /**
         * test readDir callback
         */
        const readDirCb = vi.mocked(readDir).mock.calls[0][1][0] as Function
        const stats = { isDirectory: vi.fn().mockReturnValue(false) }
        expect(readDirCb('/foo/bar.lala', stats)).toBe(true)
        expect(readDirCb('/foo/bar.js.ejs', stats)).toBe(false)
        expect(readDirCb('/foo/bar.feature', stats)).toBe(false)
        stats.isDirectory.mockReturnValue(true)
        expect(readDirCb('/foo/bar.lala', stats)).toBe(false)
        expect(readDirCb('/foo/bar.js.ejs', stats)).toBe(false)
        expect(readDirCb('/foo/bar.feature', stats)).toBe(false)

        expect(ejs.renderFile).toBeCalledTimes(4)
        expect(ejs.renderFile).toBeCalledWith(
            '/foo/bar/loo/page.js.ejs',
            { answers },
            expect.any(Function)
        )
        expect(ejs.renderFile).toBeCalledWith(
            '/foo/bar/example.e2e.js',
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

        expect(readDir).toBeCalledTimes(2)
        expect(vi.mocked(readDir).mock.calls[0][0]).toContain('mochaJasmine')
        expect(vi.mocked(readDir).mock.calls[1][0]).toContain('pageobjects')

        /**
         * test readDir callback
         */
        const readDirCb = vi.mocked(readDir).mock.calls[0][1][0] as Function
        const stats = { isDirectory: vi.fn().mockReturnValue(false) }
        expect(readDirCb('/foo/bar.lala', stats)).toBe(true)
        expect(readDirCb('/foo/bar.js.ejs', stats)).toBe(false)
        expect(readDirCb('/foo/bar.feature', stats)).toBe(false)
        stats.isDirectory.mockReturnValue(true)
        expect(readDirCb('/foo/bar.lala', stats)).toBe(false)
        expect(readDirCb('/foo/bar.js.ejs', stats)).toBe(false)
        expect(readDirCb('/foo/bar.feature', stats)).toBe(false)

        expect(ejs.renderFile).toBeCalledTimes(4)
        expect(ejs.renderFile).toBeCalledWith(
            '/foo/bar/loo/page.js.ejs',
            { answers },
            expect.any(Function)
        )
        expect(ejs.renderFile).toBeCalledWith(
            '/foo/bar/example.e2e.js',
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

    it('Jasmine with page generation and no pageObjects', async () => {
        vi.mocked(readDir).mockResolvedValue([] as any)
        const answers = {
            runner: 'local',
            specs: './tests/e2e/**/*.js',
            framework: 'jasmine',
            generateTestFiles: false,
            usePageObjects: false
        }

        await generateTestFiles(answers as any)

        expect(readDir).toBeCalledTimes(1)
        expect(ejs.renderFile).toBeCalledTimes(0)
    })

    it('Cucumber with page generation and no pageObjects', async () => {
        vi.mocked(readDir).mockResolvedValue([] as any)
        const answers = {
            runner: 'local',
            specs: './tests/e2e/**/*.js',
            framework: 'cucumber',
            generateTestFiles: false,
            usePageObjects: false,
        }

        await generateTestFiles(answers as any)

        expect(readDir).toBeCalledTimes(1)
        expect(ejs.renderFile).toBeCalledTimes(0)
    })

    it('Cucumber without page objects', async () => {
        vi.mocked(readDir).mockResolvedValue([
            '/foo/bar/loo/step_definition/example.step.js',
            '/foo/bar/example.feature'
        ] as any)
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

        expect(readDir).toBeCalledTimes(1)
        expect(vi.mocked(readDir).mock.calls[0][0]).toContain('cucumber')
        expect(ejs.renderFile).toBeCalledTimes(2)
        expect(ejs.renderFile).toBeCalledWith(
            '/foo/bar/loo/step_definition/example.step.js',
            { answers },
            expect.any(Function)
        )
        expect(ejs.renderFile).toBeCalledWith(
            '/foo/bar/example.feature',
            { answers },
            expect.any(Function)
        )
        expect(fs.mkdir).toBeCalledTimes(2)
    })

    it('Cucumber with page objects and TypeScript', async () => {
        vi.mocked(readDir).mockResolvedValue([
            '/foo/bar/loo/page.js.ejs',
            '/foo/bar/loo/step_definition/example.step.js',
            '/foo/bar/example.feature'
        ] as any)
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

        expect(readDir).toBeCalledTimes(2)
        expect(vi.mocked(readDir).mock.calls[0][0]).toContain('cucumber')
        expect(ejs.renderFile).toBeCalledTimes(6)
        expect(ejs.renderFile).toBeCalledWith(
            '/foo/bar/loo/step_definition/example.step.js',
            { answers },
            expect.any(Function)
        )
        expect(ejs.renderFile).toBeCalledWith(
            '/foo/bar/example.feature',
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
                'wdio-electron-service$--$electron'
            ]
        },
        packagesToInstall: [],
        tsConfigFilePath: '/foobar/tsconfig.json'
    } as any
    await setupTypeScript(parsedAnswers)
    expect(vi.mocked(fs.writeFile).mock.calls[0][1]).toMatchSnapshot()
})

test('setupTypeScript does not create tsconfig.json if TypeScript was not selected', async () => {
    const parsedAnswers = {
        isUsingTypeScript: false,
        esmSupport: true,
        rawAnswers: {
            framework: 'foo',
            services: [
                'wdio-foobar-service$--$foobar',
                'wdio-electron-service$--$electron'
            ]
        },
        packagesToInstall: [],
        tsConfigFilePath: '/foobar/tsconfig.json'
    } as any
    await setupTypeScript(parsedAnswers)
    expect(fs.writeFile).not.toBeCalled()
    expect(parsedAnswers.packagesToInstall).toEqual([])
})

test('setupTypeScript does not create tsconfig.json if there is already one', async () => {
    const parsedAnswers = {
        isUsingTypeScript: true,
        esmSupport: true,
        rawAnswers: {
            framework: 'foo',
            services: [
                'wdio-foobar-service$--$foobar',
                'wdio-electron-service$--$electron'
            ]
        },
        packagesToInstall: [],
        tsConfigFilePath: '/foobar/tsconfig.json',
        hasRootTSConfig: true
    } as any
    await setupTypeScript(parsedAnswers)
    expect(fs.writeFile).not.toBeCalled()
})

describe.skip('createWDIOScript', () => {
    it('can run with success', async () => {
        const promise = createWDIOScript({ wdioConfigPath: '/foo/bar/wdio.conf.js' } as any)
        expect(await promise)
            .toBe(true)
        expect(cp.spawn).toBeCalledTimes(1)
    })

    it('does not fail the process if spawn errors out', async () => {
        vi.mocked(cp.spawn).mockReturnValue({ on: vi.fn().mockImplementation((ev, fn) => fn(1)) } as any)
        expect(await createWDIOScript({ wdioConfigPath: '/foo/bar/wdio.conf.js' } as any))
            .toBe(false)
        expect(cp.spawn).toBeCalledTimes(1)
    })
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
})
afterEach(()=>{
    vi.mocked(inquirer.prompt).mockClear()
    vi.mocked(readDir).mockClear()
    vi.mocked(ejs.renderFile).mockClear()
    vi.mocked(fs.writeFile).mockClear()
    vi.mocked(fs.mkdir).mockClear()
    vi.mocked(cp.spawn).mockClear()
    vi.mocked(installPackages).mockClear()
})
