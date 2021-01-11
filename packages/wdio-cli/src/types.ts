import { BACKEND_CHOICES, MODE_OPTIONS, REGION_OPTION, COMPILER_OPTION_ANSWERS } from './constants'

type ValueOf<T> = T[keyof T]

export interface Questionnair {
    runner: 'local'
    backend: ValueOf<typeof BACKEND_CHOICES>
    hostname: string
    port: string
    path: string
    expEnvAccessKey: string
    expEnvHostname: string
    expEnvPort: string
    expEnvProtocol: 'http' | 'https'
    // eslint-disable-next-line
    env_user: string
    // eslint-disable-next-line
    env_key: string
    headless: boolean
    region: ValueOf<typeof REGION_OPTION>
    framework: string
    executionMode: ValueOf<typeof MODE_OPTIONS>
    specs: string
    stepDefinitions: string
    generateTestFiles: boolean
    usePageObjects: boolean
    pages: string
    isUsingCompiler: ValueOf<typeof COMPILER_OPTION_ANSWERS>
    reporters: string[]
    services: string[]
    outputDir: string
    baseUrl: string
}

export interface ParsedAnswers extends Omit<Questionnair, 'runner' | 'framework' | 'reporters' | 'services'> {
    runner: 'local'
    framework: string
    reporters: string[]
    services: string[]
    packagesToInstall: string[]
    isUsingTypeScript: boolean
    isUsingBabel: boolean
    isSync: boolean
    _async: string
    _await: string
    destSpecRootPath: string
    destPageObjectRootPath: string
    relativePath: string
}

export interface RunCommandArguments {
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
    reporters?: any
    suite?: string[]
    spec?: string[]
    exclude?: string[]
    mochaOpts?: any
    jasmineNodeOpts?: any
    cucumberOpts?: any
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
}

export interface InstallCommandArguments {
    yarn: boolean
    config: string
    type: 'service' | 'reporter' | 'framework'
    name: string
}

export interface ConfigCommandArguments {
    yarn: boolean
    yes: boolean
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
