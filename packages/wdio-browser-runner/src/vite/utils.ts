
import fs from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'
import logger from '@wdio/logger'
import { resolve } from 'import-meta-resolve'
import type { Alias, AliasOptions, InlineConfig } from 'vite'

import { WDIO_EVENT_NAME } from '../constants.js'
import { MOCHA_VARIABELS } from '../constants.js'
import type { Environment, FrameworkPreset } from '../types.js'

const log = logger('@wdio/browser-runner')
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * Serialize a value for an inline `<script>`, so a quote, `</script>` or `<!--`
 * in it (e.g. in a spec path) can't end the string or the script element
 */
function toScriptValue (value: unknown) {
    return JSON.stringify(value).replace(/</g, '\\u003c')
}

function escapeHtmlAttribute (value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

/**
 * Turn Vite's `resolve.alias` (an object, or the `{ find, replacement }` list a
 * resolved config has) into the prefix map `wdioImport` resolves mocks with.
 * RegExp aliases can't be applied as a prefix and are left out. A Windows path
 * (`C:\src`) becomes the URL path (`/C:/src`) that mocks are stored under.
 */
export function getAliasMap (alias?: AliasOptions): Record<string, string> {
    if (!alias) {
        return {}
    }
    const entries = Array.isArray(alias)
        ? (alias as Alias[]).filter((entry) => typeof entry.find === 'string').map((entry) => [entry.find as string, entry.replacement])
        : Object.entries(alias as Record<string, string>)
    return Object.fromEntries(entries.map(([find, replacement]) => [
        find,
        /^[a-zA-Z]:[\\/]/.test(replacement) ? url.pathToFileURL(replacement).pathname : replacement
    ]))
}

export async function getTemplate(
    options: WebdriverIO.BrowserRunnerOptions,
    env: Environment,
    spec: string,
    p = process,
    alias = getAliasMap((options.viteConfig as (InlineConfig | undefined))?.resolve?.alias)
) {
    const root = options.rootDir || process.cwd()
    const isHeadless = options.headless || Boolean(process.env.CI)
    const usesTailwindCSS = await hasFileByExtensions(path.join(root, 'tailwind.config'))

    /**
     * clean up some values that might cause serialization issues
     */
    if ('runner' in env.config) {
        delete env.config.runner
    }

    let sourceMapScript = ''
    let sourceMapSetupCommand = ''
    try {
        const sourceMapSupportDir = await resolve('source-map-support', import.meta.url)
        sourceMapScript = /*html*/`<script src="/@fs/${url.fileURLToPath(path.dirname(sourceMapSupportDir))}/browser-source-map-support.js"></script>`
        sourceMapSetupCommand = 'sourceMapSupport.install()'
    } catch (err) {
        log.error(`Failed to setup source-map-support: ${(err as Error).message}`)
    }

    return /* html */`
    <!doctype html>
    <html>
        <head>
            <title>WebdriverIO Browser Test</title>
            <link rel="icon" type="image/x-icon" href="https://webdriver.io/img/favicon.png">
            ${usesTailwindCSS ? /*html*/'<link rel="stylesheet" href="/node_modules/tailwindcss/tailwind.css">' : ''}
            <script type="module">
                const alias = ${toScriptValue(alias)}
                window.__wdioMockCache__ = new Map()
                window.WDIO_EVENT_NAME = '${WDIO_EVENT_NAME}'
                window.wdioImport = function (modName, mod) {
                    /**
                     * attempt to resolve direct import
                     */
                    if (window.__wdioMockCache__.get(modName)) {
                        return window.__wdioMockCache__.get(modName)
                    }

                    /**
                     * if above fails, check if we have an alias for it
                     */
                    for (const [aliasName, aliasPath] of Object.entries(alias)) {
                        if (modName.slice(0, aliasName.length) === aliasName) {
                            modName = modName.replace(aliasName, aliasPath)
                        }
                    }
                    if (window.__wdioMockCache__.get(modName)) {
                        return window.__wdioMockCache__.get(modName)
                    }
                    return mod
                }
            </script>
            <link rel="stylesheet" href="@wdio/browser-runner/third_party/mocha.css">
            <script type="module" src="@wdio/browser-runner/third_party/mocha.js"></script>
            ${sourceMapScript}
            <script type="module">
                ${sourceMapSetupCommand}

                /**
                 * Inject environment variables
                 */
                window.__wdioEnv__ = ${toScriptValue(env)}
                window.__wdioSpec__ = ${toScriptValue(spec)}
                window.__wdioEvents__ = []
                /**
                 * listen to window errors during bootstrap phase; once Mocha runs
                 * the tests, it reports their errors itself
                 */
                window.__wdioErrors__ = []
                addEventListener('error', (ev) => {
                    if (window.__wdioTestsStartedAt__) {
                        return
                    }
                    window.__wdioErrors__.push({
                        filename: ev.filename,
                        message: ev.message,
                        error: ev.error && ev.error.stack
                    })
                })
                /**
                 * mock process
                 */
                window.process = window.process || {
                    platform: 'browser',
                    env: ${toScriptValue(p.env)},
                    stdout: {},
                    stderr: {},
                    cwd: () => ${toScriptValue(p.cwd())},
                }
            </script>
            <script type="module" src="@wdio/browser-runner/setup"></script>
            <style>
                ${MOCHA_VARIABELS}

                body {
                    width: calc(100% - 500px);
                    padding: 0;
                    margin: 0;
                }
            </style>
        </head>
        <body>
            <mocha-framework spec="${escapeHtmlAttribute(spec)}" ${isHeadless ? 'style="display: none"' : ''}></mocha-framework>
        </body>
    </html>`
}

export async function userfriendlyImport(preset: FrameworkPreset, pkg?: string) {
    if (!pkg) {
        return {}
    }

    try {
        return await import(pkg)
    } catch {
        throw new Error(
            `Couldn't load preset "${preset}" given important dependency ("${pkg}") is not installed.\n` +
            `Please run:\n\n\tnpm install ${pkg}\n\tor\n\tyarn add --dev ${pkg}`
        )
    }
}

export function normalizeId(id: string, base?: string): string {
    if (base && id.startsWith(base)) {
        id = `/${id.slice(base.length)}`
    }

    return id
        .replace(/^\/@id\/__x00__/, '\0') // virtual modules start with `\0`
        .replace(/^\/@id\//, '')
        .replace(/^__vite-browser-external:/, '')
        .replace(/^node:/, '')
        .replace(/[?&]v=\w+/, '?') // remove ?v= query
        .replace(/\?$/, '') // remove end query mark
}

export async function getFilesFromDirectory (dir: string) {
    /**
     * check if dir exists
     */
    const isExisting = await fs.access(dir).then(() => true, () => false)
    if (!isExisting) {
        return []
    }

    let files = await fs.readdir(dir)
    files = (await Promise.all(files.map(async file => {
        const filePath = path.join(dir, file)
        const stats = await fs.stat(filePath)
        if (stats.isDirectory()) {
            return getFilesFromDirectory(filePath)
        } else if (stats.isFile()) {
            return filePath
        }
    }))).filter(Boolean) as string[]

    return files.reduce((all, folderContents) => all.concat(folderContents), [] as string[])
}

let mockedModulesList: ([string, string])[]
export async function getManualMocks(automockDir: string) {
    /**
     * read available mocks only one time
     */
    if (!mockedModulesList) {
        mockedModulesList = (await getFilesFromDirectory(automockDir))
            /**
             * seperate to module name and actual path
             */
            .map((filePath) => [
                filePath,
                filePath.slice(automockDir.length + 1).slice(0, -path.extname(filePath).length)
            ])
    }

    return mockedModulesList
}

const EXTENSION = ['.js', '.ts', '.mjs', '.cjs', '.mts']
export async function hasFileByExtensions (p: string, extensions = EXTENSION) {
    return (await Promise.all([
        fs.access(p).then(() => p, () => undefined),
        ...extensions.map((ext) => fs.access(p + ext).then(() => p + ext, () => undefined))
    ])).filter(Boolean)[0]
}

export function hasDir (p: string) {
    return fs.stat(p).then((s) => s.isDirectory(), () => false)
}

export function getErrorTemplate(filename: string, error: Error) {
    return /*html*/`
        <pre>${error.stack}</pre>
        <script type="module">
            window.__wdioErrors__ = [{
                filename: "${filename}",
                message: \`${error.message}\`
            }]
        </script>
    `
}
