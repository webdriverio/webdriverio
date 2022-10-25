import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

import { esbuildCommonjs } from '@originjs/vite-plugin-commonjs'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import type { InlineConfig } from 'vite'

import { testrunner } from './plugins/testrunner.js'
import { EVENTS, PRESET_DEPENDENCIES } from './constants.js'
import type { Environment, FrameworkPreset } from './types'

export async function getTemplate (options: WebdriverIO.BrowserRunnerOptions, env: Environment, spec: string) {
    const root = options.rootDir || process.cwd()
    const require = createRequire(path.join(root, 'node_modules'))
    const listeners = Object.entries(EVENTS).map(([mochaEvent, wdioEvent]) => (
        /*js*/`runner.on('${mochaEvent}', (payload) => {
            window.__wdioEvents__.push(formatMessage({ type: '${wdioEvent}', payload, err: payload.err }))
        })`
    )).join('\n')

    let vueDeps = ''
    if (options.preset) {
        try {
            const vueDir = path.dirname(require.resolve('vue'))
            const vueScript = (await fs.readFile(path.join(vueDir, 'dist', 'vue.global.prod.js'), 'utf-8')).toString()
            vueDeps += /*html*/`
            <script type="module">
                ${vueScript}
                window.Vue = Vue
            </script>`
            const vueCompilerDir = path.dirname(require.resolve('@vue/compiler-dom'))
            const vueCompilerScript = (await fs.readFile(path.join(vueCompilerDir, 'dist', 'compiler-dom.global.prod.js'), 'utf-8')).toString()
            vueDeps += /*html*/`
            <script type="module">
                ${vueCompilerScript}
                window.VueCompilerDOM = VueCompilerDOM
            </script>`
        } catch (err: any) {
            throw new Error(
                `Fail to set-up Vue environment: ${err.message}\n\n` +
                'Make sure you have "vue" and "@vue/compiler-dom" installed as dependencies!'
            )
        }
    }

    return /* html */`
    <!doctype html>
    <html>
        <head>
            <title>WebdriverIO Browser Test</title>
            <link rel="stylesheet" href="https://unpkg.com/mocha@10.0.0/mocha.css">
            <script type="module">
                window.__wdioErrors__ = []
                addEventListener('error', (ev) => window.__wdioErrors__.push({
                    filename: ev.filename,
                    message: ev.message
                }))
            </script>
            ${vueDeps}
            <script type="module">
            window.Symbol.for = (a) => a

            import Mocha from 'https://esm.sh/mocha@10.0.0'
            const mocha = Mocha.setup(${JSON.stringify(env.args || {})})
            </script>
        </head>
        <body>
            <div id="mocha"></div>
            <script type="module" src="${spec}"></script>
            <script type="module">
                import { formatMessage } from '@wdio/mocha-framework/common'

                window.__wdioEvents__ = []
                const runner = mocha.run((failures) => {
                    window.__wdioFailures__ = failures
                })
                ${listeners}
            </script>
        </body>
    </html>`
}

export async function getErrorTemplate (filename: string, error: Error) {
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

async function userfriendlyImport (preset: FrameworkPreset, pkg?: string) {
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

export async function getViteConfig (options: WebdriverIO.BrowserRunnerOptions, root: string, port: number) {
    /**
     * user provided vite config
     */
    if (options.viteConfig) {
        return Object.assign({}, options.viteConfig, {
            plugins: [
                testrunner(options),
                ...(options.viteConfig.plugins || [])
            ]
        })
    }

    const config: Partial<InlineConfig> = {
        configFile: false,
        root,
        server: { port, host: 'localhost' },
        plugins: [testrunner(options)],
        optimizeDeps: {
            esbuildOptions: {
                // Node.js global to browser globalThis
                define: {
                    global: 'globalThis',
                },
                // Enable esbuild polyfill plugins
                plugins: [
                    NodeGlobalsPolyfillPlugin({
                        process: true,
                        buffer: true
                    }),
                    esbuildCommonjs(['@testing-library/vue'])
                ],
            },
        }
    }

    if (options.preset) {
        const [pkg, importProp, opts] = PRESET_DEPENDENCIES[options.preset] || []
        const plugin = (await userfriendlyImport(options.preset, pkg))[importProp || 'default']
        if (plugin) {
            config.plugins!.push(plugin(opts))
        }
    }

    return config
}
