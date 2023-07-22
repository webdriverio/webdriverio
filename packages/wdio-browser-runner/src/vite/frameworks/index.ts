import type { Options } from '@wdio/types'

import { isNuxtFramework, optimizeForNuxt } from './nuxt.js'

export default async function updateViteConfig (options: WebdriverIO.BrowserRunnerOptions, config: Options.Testrunner) {
    const isNuxt = await isNuxtFramework(config.rootDir || process.cwd())
    if (isNuxt) {
        await optimizeForNuxt(options, config)
    }
}
