import url from 'node:url'
import path from 'node:path'
import { resolve } from 'import-meta-resolve'
import type { InlineConfig } from 'vite'

import { hasFileByExtensions } from '../utils.js'

/**
 * returns `true` if TailwindCSS config exist but no postcss.config
 * (if a `postcss.config` exists it will be automatically picked up by Vite)
 */
export function isUsingTailwindCSS (rootDir: string) {
    return Promise.all([
        hasFileByExtensions(path.join(rootDir, 'tailwind.config')),
        hasFileByExtensions(path.join(rootDir, 'postcss.config'))
    ]).then(([hasTailwindConfig, hasPostCSSConfig]) => {
        console.log(hasTailwindConfig, !hasPostCSSConfig)
        return hasTailwindConfig && !hasPostCSSConfig
    })
}

/**
 * add tailwind plugin if installed as dependency
 */
export async function optimizeForTailwindCSS (rootDir: string) {
    const viteConfig: InlineConfig = {}
    const tailwindcssPath = await resolve('tailwindcss', url.pathToFileURL(path.resolve(rootDir, 'index.js')).href)
    const tailwindcss = (await import(tailwindcssPath)).default
    viteConfig.css = {
        postcss: { plugins: [tailwindcss] }
    }
    return viteConfig
}
