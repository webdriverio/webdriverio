import type { BackendChoice, RegionOptions, ElectronBuildToolChoice,  } from './constants.js'
import type { PackageJson as typeFestPackageJson } from 'type-fest'
import type { Package as normalizePackage } from 'normalize-package-data'
export type NormalizedPackageJson = PackageJson & normalizePackage
export type PackageJson = typeFestPackageJson

export interface ProgramOpts {
    info: boolean
    dev: boolean
    yes: boolean
    npmTag: string
}

export interface Questionnair {
    runner: string
    preset?: string
    installTestingLibrary?: boolean
    electronAppBinaryPath?: string
    electronBuildTool?: ElectronBuildToolChoice
    electronBuilderConfigPath?: string
    backend?: BackendChoice
    hostname?: string
    port?: string
    path?: string
    expEnvAccessKey?: string
    expEnvHostname?: string
    expEnvPort?: string
    expEnvProtocol?: 'http' | 'https'

    env_user?: string

    env_key?: string
    region?: RegionOptions
    useSauceConnect?: boolean
    framework: string
    specs?: string
    stepDefinitions?: string
    generateTestFiles: boolean
    usePageObjects?: boolean
    pages?: string
    isUsingTypeScript: boolean
    reporters: string[]
    services: string[]
    serenityLibPath?: string
    plugins: string[]
    outputDir?: string
    includeVisualTesting: boolean
    npmInstall: boolean
    createPackageJSON?: boolean
    projectRootCorrect?: boolean
    projectRoot?: string
    e2eEnvironment?: 'web' | 'mobile'
    mobileEnvironment?: 'android' | 'ios'
    browserEnvironment?: ('chrome' | 'firefox' | 'safari' | 'microsoftedge')[]
}

export interface ParsedAnswers extends Omit<Questionnair, 'runner' | 'framework' | 'reporters' | 'services' | 'plugins'> {
    rawAnswers: Questionnair
    runner: 'local' | 'browser'
    projectName: string
    framework: string
    purpose: string
    reporters: string[]
    plugins: string[]
    services: string[]
    packagesToInstall: string[]
    isUsingTypeScript: boolean
    serenityAdapter: string | false
    esmSupport: boolean
    isSync: boolean
    _async: string
    _await: string
    projectRootDir: string
    destSpecRootPath: string
    destPageObjectRootPath: string
    destStepRootPath: string;
    destSerenityLibRootPath: string
    relativePath: string
    hasRootTSWdioConfig: boolean
    tsConfigFilePath: string
    tsProject: string
    wdioConfigPath: string
}

export interface ConfigCommandArguments {
    yarn: boolean
    yes: boolean
    npmTag: string
}

export interface SupportedPackage {
    package: string
    short: string
    purpose: string
}

export interface ProjectProps {
    esmSupported: boolean
    path: string
    packageJson: NormalizedPackageJson
}

export interface InstallCommandArguments {
    config?: string
    type: 'service' | 'reporter' | 'framework' | 'plugin'
    name: string
}
