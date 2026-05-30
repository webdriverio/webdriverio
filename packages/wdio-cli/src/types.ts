import type { Options, Reporters } from '@wdio/types'
import type { NormalizedPackageJson } from 'read-pkg-up'
import type { SUPPORTED_PACKAGE_MANAGERS } from 'create-wdio/utils'

export type PM = typeof SUPPORTED_PACKAGE_MANAGERS[number]

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
    shard?: Options.ShardOptions
    waitforTimeout?: number
    framework?: string
    reporters?: Reporters.ReporterEntry[]
    suite?: string[]
    spec?: string[]
    exclude?: string[]
    mochaOpts?: WebdriverIO.MochaOpts
    jasmineOpts?: WebdriverIO.JasmineOpts
    cucumberOpts?: WebdriverIO.CucumberOpts
    configPath: string
    updateSnapshots?: Options.Testrunner['updateSnapshots']
    tsConfigPath?: string

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
    config?: string
    type: 'service' | 'reporter' | 'framework' | 'plugin'
    name: string
}

export interface SupportedPackage {
    package: string
    short: string
    purpose: string
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
    | IterateeShorthand<T>
type IterateeShorthand<T> =
    | PropertyName
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | [PropertyName, any]
    | PartialShallow<T>
type PropertyName = string | number | symbol
type PartialShallow<T> = {
    [P in keyof T]?: T[P] extends object ? object : T[P];
}
type NotVoid = unknown

export interface ProjectProps {
    esmSupported: boolean
    path: string
    packageJson: NormalizedPackageJson
}
