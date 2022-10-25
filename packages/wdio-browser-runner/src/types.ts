import type { InlineConfig } from 'vite'
import type { Workers } from '@wdio/types'

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
}

export interface Environment {
    args: any
}
