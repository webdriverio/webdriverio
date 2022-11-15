import type { InlineConfig } from 'vite'
import type { Workers, Capabilities, Options } from '@wdio/types'

declare global {
    interface Window {
        __wdioEnv__: Environment
        wdioDebugContinue: (value: unknown) => void
    }
}

export type FrameworkPreset = 'react' | 'preact' | 'vue' | 'svelte' | 'lit'

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
    args: any
    config: Options.Testrunner
    capabilities: Capabilities.RemoteCapability
    sessionId: string
    injectGlobals: boolean
}

export interface ConsoleEvent {
    name: 'consoleEvent'
    type: 'log' | 'info' | 'warn' | 'debug' | 'error'
    args: unknown[]
    cid: string
}
