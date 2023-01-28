import type { Options, Reporters } from '@wdio/types'
import type { NormalizedPackageJson } from 'read-pkg-up'
import type { BACKEND_CHOICES, REGION_OPTION, COMPILER_OPTION_ANSWERS } from './constants.js'

type ValueOf<T> = T[keyof T]

export interface Questionnair {
    runner: string
    preset?: string
    installTestingLibrary?: boolean
    backend: ValueOf<typeof BACKEND_CHOICES>
    hostname?: string
    port?: string
    path?: string
    expEnvAccessKey?: string
    expEnvHostname?: string
    expEnvPort?: string
    expEnvProtocol?: 'http' | 'https'
    // eslint-disable-next-line
    env_user?: string
    // eslint-disable-next-line
    env_key?: string
    region?: ValueOf<typeof REGION_OPTION>
    framework: string
    specs?: string
    stepDefinitions?: string
    generateTestFiles: boolean
    usePageObjects?: boolean
    pages?: string
    isUsingCompiler: ValueOf<typeof COMPILER_OPTION_ANSWERS>
    reporters: string[]
    services: string[]
    plugins: string[]
    outputDir?: string
    baseUrl: string
    npmInstall: boolean
    createPackageJSON?: boolean
    moduleSystem?: 'esm' | 'commonjs'
    projectRootCorrect?: boolean
    projectRoot?: string
}

export interface ParsedAnswers extends Omit<Questionnair, 'runner' | 'framework' | 'reporters' | 'services' | 'plugins'> {
    rawAnswers: Questionnair
    runner: 'local' | 'browser'
    framework: string
    reporters: string[]
    plugins: string[]
    services: string[]
    packagesToInstall: string[]
    isUsingTypeScript: boolean
    isUsingBabel: boolean
    esmSupport: boolean
    isSync: boolean
    _async: string
    _await: string
    projectRootDir: string
    destSpecRootPath: string
    destPageObjectRootPath: string
    relativePath: string
    tsConfigFilePath: string
    tsProject: string
    wdioConfigPath: string
}

export interface RunCommandArguments {
    coverage?: boolean
    watch?: boolean
    hostname?: string
    port?: number
    path?: string
    user?: string
    key?: string
    logLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent'
    bail?: number
    baseUrl?: string
    waitforTimeout?: number
    framework?: string
    reporters?: Reporters.ReporterEntry[]
    suite?: string[]
    spec?: string[]
    exclude?: string[]
    mochaOpts?: WebdriverIO.MochaOpts
    jasmineOpts?: WebdriverIO.JasmineOpts
    cucumberOpts?: WebdriverIO.CucumberOpts
    autoCompileOpts?: Options.AutoCompileConfig
    configPath: string

    /**
     * @internal
     */
    ignoredWorkerServices?: string[]
}

export interface ReplCommandArguments {
    platformVersion: string
    deviceName: string
    udid: string
    option: string
    capabilities: string
}

export interface InstallCommandArguments {
    yarn: boolean
    config: string
    type: 'service' | 'reporter' | 'framework' | 'plugin'
    name: string
}

export interface ConfigCommandArguments {
    yarn: boolean
    yes: boolean
    npmTag: string
}

export interface SupportedPackage {
    package: string
    short: string
}

export interface OnCompleteResult {
    finished: number
    passed: number
    retries: number
    failed: number
}

/** Extracted from @types/lodash@4.14.168 */
export type ValueKeyIteratee<T> =
    | ((value: T, key: string) => NotVoid)
    | IterateeShorthand<T>;
type IterateeShorthand<T> =
    | PropertyName
    | [PropertyName, any]
    | PartialShallow<T>;
type PropertyName = string | number | symbol;
type PartialShallow<T> = {
    [P in keyof T]?: T[P] extends object ? object : T[P];
};
type NotVoid = unknown;

export interface ProjectProps {
    esmSupported: boolean
    path: string
    packageJson: NormalizedPackageJson
}
