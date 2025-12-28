import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

export const isTypeAware = (() => {
    try {
        require('typescript')
        require('typescript-eslint')
    } catch {
        return false
    }

    try {
        require('@typescript-eslint/eslint-plugin')
        return true
    } catch {
        console.warn('The "wdio/no-floating-promise" rule requires "@typescript-eslint/eslint-plugin" to be installed.')
        return false
    }
})()

