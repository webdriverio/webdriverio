import type { InlineConfig } from 'vite'
import type { Options } from '@wdio/types'

import { isNuxtFramework, optimizeForNuxt } from './nuxt.js'

export default async function updateViteConfig (viteConfig: Partial<InlineConfig>, options: WebdriverIO.BrowserRunnerOptions, config: Options.Testrunner) {
    const isNuxt = await isNuxtFramework(config.rootDir || process.cwd())
    if (isNuxt) {
        await optimizeForNuxt(viteConfig, options, config)
    }
}
