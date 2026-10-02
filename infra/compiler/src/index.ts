import { parseArgs } from 'node:util'
import { build, context } from 'esbuild'

import { createBuildConfigs } from './configs.js'

const args = process.argv.slice(2)
const options = {
    project: {
        type: 'string',
        short: 'p',
        multiple: true,
    },
    watch: {
        type: 'boolean',
    },
    clear: {
        type: 'boolean'
    }
} as const

const { values } = parseArgs({ args, options })
const configs = await createBuildConfigs(values)

if (configs.length === 0) {
    throw new Error(`No packages found to build using params: ${JSON.stringify(values)}`)
}

/**
 * build packages
 */
await Promise.all(configs.map(async (config) => {
    if (values.watch) {
        const ctx = await context(config)
        return ctx.watch()
    }

    const result = await build(config)
    if (result.errors.length > 0) {
        console.error(result.errors)
        throw new Error('Failed to build packages')
    }
}))
