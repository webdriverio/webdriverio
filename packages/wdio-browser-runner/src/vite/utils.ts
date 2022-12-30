import fs from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'
import { resolve } from 'import-meta-resolve'

import type { Environment, FrameworkPreset } from '../types.js'

export async function getTemplate (options: WebdriverIO.BrowserRunnerOptions, env: Environment, spec: string) {
    const root = options.rootDir || process.cwd()

    let vueDeps = ''
    if (options.preset === 'vue') {
        try {
            const rootFileUrl = url.pathToFileURL(root).href
            const vueDir = path.dirname(url.fileURLToPath(await resolve('vue', `${rootFileUrl}/node_modules`)))
            const vueScript = (await fs.readFile(path.join(vueDir, 'dist', 'vue.global.prod.js'), 'utf-8')).toString()
            vueDeps += /*html*/`
            <script type="module">
                ${vueScript}
                window.Vue = Vue
            </script>`
            const vueCompilerDir = path.dirname(url.fileURLToPath(await resolve('@vue/compiler-dom', `${rootFileUrl}/node_modules`)))
            const vueCompilerScript = (await fs.readFile(path.join(vueCompilerDir, 'dist', 'compiler-dom.global.prod.js'))).toString()
            vueDeps += /*html*/`
            <script type="module">
                ${vueCompilerScript}
                window.VueCompilerDOM = VueCompilerDOM
            </script>`
        } catch (err: any) {
            throw new Error(
                `Fail to set-up Vue environment: ${err.message}\n\n` +
                'Make sure you have "vue" and "@vue/compiler-dom" installed as dependencies!\n' +
                `Error: ${err.stack}`
            )
        }

    }

    return /* html */`
    <!doctype html>
    <html>
        <head>
            <title>WebdriverIO Browser Test</title>
            <link rel="icon" type="image/x-icon" href="https://webdriver.io/img/favicon.png">
            <link rel="stylesheet" href="https://unpkg.com/mocha@10.0.0/mocha.css">
            <script type="module">
                /**
                 * Inject environment variables
                 */
                window.__wdioEnv__ = ${JSON.stringify(env)}
                window.__wdioSpec__ = '${spec}'
                window.__wdioEvents__ = []
                /**
                 * listen to window errors during bootstrap phase
                 */
                window.__wdioErrors__ = []
                addEventListener('error', (ev) => window.__wdioErrors__.push({
                    filename: ev.filename,
                    message: ev.message
                }))
            </script>
            ${vueDeps}
        </head>
        <body>
            <div id="mocha"></div>
            <script async type="module" src="@wdio/browser-runner/setup"></script>
        </body>
    </html>`
}

export async function userfriendlyImport (preset: FrameworkPreset, pkg?: string) {
    if (!pkg) {
        return {}
    }

    try {
        return await import(pkg)
    } catch (err: any) {
        throw new Error(
            `Couldn't load preset "${preset}" given important dependency ("${pkg}") is not installed.\n` +
            `Please run:\n\n\tnpm install ${pkg}\n\tor\n\tyarn add --dev ${pkg}`
        )
    }
}

export function getErrorTemplate (filename: string, error: Error) {
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
