import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

export const isTypeAware = (() => {
    try {
        require('typescript-eslint')
        return true
    } catch {
        return false
    }
})()

