import type { Browser } from 'webdriverio'
import type { Environment, FrameworkPreset } from './types'

export const SESSIONS = new Map<string, Environment>()
export const BROWSER_POOL: Map<number, Promise<Browser<'async'>>> = new Map()

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
