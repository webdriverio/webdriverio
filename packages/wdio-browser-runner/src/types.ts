import type { InlineConfig } from 'vite'
import type { Workers, Capabilities, Options } from '@wdio/types'
import type { MochaOpts } from '@wdio/mocha-framework'

declare global {
    interface Window {
        __wdioEnv__: Environment
        wdioDebugContinue: (value: unknown) => void
    }
}

export type FrameworkPreset = 'react' | 'preact' | 'vue' | 'svelte' | 'lit' | 'solid'

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
    viteConfig?: InlineConfig
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
