import type { ConfigEnv, InlineConfig } from 'vite'
import type { Workers, Capabilities, Options } from '@wdio/types'
import type { MochaOpts } from '@wdio/mocha-framework'
import type { IstanbulPluginOptions } from 'vite-plugin-istanbul'

declare global {
    interface Window {
        __wdioEnv__: Environment
        wdioDebugContinue: (value: unknown) => void
    }
}

export type FrameworkPreset = 'react' | 'preact' | 'vue' | 'svelte' | 'lit' | 'solid'
type Arrayable<T> = T | Array<T>
type CoverageReporter = 'clover' | 'cobertura' | 'html-spa' | 'html' | 'json-summary' | 'json' | 'lcov' | 'lcovonly' | 'none' | 'teamcity' | 'text-lcov' | 'text-summary' | 'text'
export interface CoverageOptions extends Omit<IstanbulPluginOptions, 'cypress' | 'checkProd' | 'forceBuildInstrument'> {
    /**
     * Enables coverage collection.
     *
     * @default false
     */
    enabled: boolean
    /**
     * Directory to write coverage report to.
     *
     * @default ./coverage
     */
    reportsDirectory?: string
    /**
     * Coverage reporters to use.
     * See [istanbul documentation](https://istanbul.js.org/docs/advanced/alternative-reporters/) for detailed list of all reporters.
     *
     * @default ['text', 'html', 'clover', 'json-summary']
     */
    reporter?: Arrayable<CoverageReporter>
    /**
     * Check thresholds per file.
     * See `lines`, `functions`, `branches` and `statements` for the actual thresholds.
     *
     * @default false
     */
    perFile?: boolean
    /**
     * Clean coverage results before running tests.
     *
     * @default true
     */
    clean?: boolean
    /**
     * Threshold for lines
     *
     * @default undefined
     */
    lines?: number
    /**
     * Threshold for functions
     *
     * @default undefined
     */
    functions?: number
    /**
     * Threshold for branches
     *
     * @default undefined
     */
    branches?: number
    /**
     * Threshold for statements
     *
     * @default undefined
     */
    statements?: number
}

export interface BrowserRunnerOptions {
    /**
     * Project root directory
     * @default process.cwd()
     */
    rootDir?: string
    /**
     * WebdriverIOs browser runner supports a set of presets to test for a specific framework.
     */
    preset?: FrameworkPreset
    /**
     * Vite configuration to overwrite the preset
     */
    viteConfig?: string | InlineConfig | ((env: ConfigEnv) => InlineConfig | Promise<InlineConfig>)
    /**
     * Run tests in headless mode
     * @default false // true in CI environment
     */
    headless?: boolean
    /**
     * test coverage settings
     */
    coverage?: CoverageOptions
    /**
     * If set to `true` WebdriverIO will automatically mock dependencies within the `automockDir` directory
     * @default true
     */
    automock?: boolean
    /**
     * Path of auto-mock directory. This tells WebdriverIO where to look for dependencies to mock out.
     * @default ./__mocks__
     */
    automockDir?: string
}

export interface RunArgs extends Workers.WorkerRunPayload {
    command: string
    args: any
    cid: string
}

export interface Environment {
    args: MochaOpts
    config: Options.Testrunner
    capabilities: Capabilities.RemoteCapability
    sessionId: string
    injectGlobals: boolean
}

export type MockFactoryWithHelper = (importOriginal: <T = unknown>() => Promise<T>) => any;
