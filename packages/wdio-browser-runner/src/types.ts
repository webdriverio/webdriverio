import type { InlineConfig } from 'vite'
import type { Workers, Capabilities } from '@wdio/types'

declare global {
    interface Window {
        __wdioEnv__: Environment
        __wdioErrors__: WDIOErrorEvent[]
        __wdioEvents__: any[]
        __wdioFailures__: number
        wdioDebugContinue: (value: unknown) => void
    }
}

export type WDIOErrorEvent = Pick<ErrorEvent, 'filename' | 'message'>
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
    capabilities: Capabilities.RemoteCapability
    sessionId: string
}
