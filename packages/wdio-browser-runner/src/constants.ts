import type { Browser } from 'webdriverio'
import type { Environment, FrameworkPreset } from './types'

export const SESSIONS = new Map<string, Environment>()
export const BROWSER_POOL: Map<string, Browser<'async'>> = new Map()

export const EVENTS = {
    'suite': 'suite:start',
    'suite end': 'suite:end',
    'test': 'test:start',
    'test end': 'test:end',
    'hook': 'hook:start',
    'hook end': 'hook:end',
    'pass': 'test:pass',
    'fail': 'test:fail',
    'retry': 'test:retry',
    'pending': 'test:pending'
} as const

export const PRESET_DEPENDENCIES: Record<FrameworkPreset, [string, string, any] | undefined> = {
    react: ['@vitejs/plugin-react', 'default', {
        babel: {
            assumptions: {
                setPublicClassFields: true
            },
            parserOpts: {
                plugins: ['decorators-legacy', 'classProperties']
            }
        }
    }],
    preact: ['@preact/preset-vite', 'default', undefined],
    vue: ['@vitejs/plugin-vue', 'default', undefined],
    svelte: ['@sveltejs/vite-plugin-svelte', 'svelte', undefined],
    lit: undefined
}

export const FRAMEWORK_SUPPORT_ERROR = 'Currently only "mocha" is supported as framework when using @wdio/browser-runner.'
