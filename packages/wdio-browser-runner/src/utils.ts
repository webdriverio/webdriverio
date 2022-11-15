import fs from 'node:fs/promises'
import path from 'node:path'

import { createRequire } from 'node:module'

import getPort from 'get-port'
import logger from '@wdio/logger'
import topLevelAwait from 'vite-plugin-top-level-await'
import { deepmerge } from 'deepmerge-ts'
import { executeHooksWithArgs } from '@wdio/utils'
import { WebSocketServer, WebSocket } from 'ws'
import { esbuildCommonjs } from '@originjs/vite-plugin-commonjs'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { serializeError } from 'serialize-error'
import type { InlineConfig } from 'vite'
import type { Browser } from 'webdriverio'
import type { Services } from '@wdio/types'

import { testrunner } from './plugins/testrunner.js'
import { EVENTS, PRESET_DEPENDENCIES, BROWSER_POOL, SESSIONS } from './constants.js'
import type { Environment, FrameworkPreset } from './types'

const log = logger('@wdio/browser-runner')

export async function getTemplate (options: WebdriverIO.BrowserRunnerOptions, env: Environment, spec: string) {
    const root = options.rootDir || process.cwd()
    const require = createRequire(path.join(root, 'node_modules'))
    const listeners = Object.entries(EVENTS).map(([mochaEvent, wdioEvent]) => (
        /*js*/`runner.on('${mochaEvent}', (payload) => {
            window.__wdioEvents__.push(formatMessage({ type: '${wdioEvent}', payload, err: payload.err }))
        })`
    )).join('\n')

    let vueDeps = ''
    if (options.preset === 'vue') {
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
            <link rel="icon" type="image/x-icon" href="https://webdriver.io/img/favicon.png">
            <link rel="stylesheet" href="https://unpkg.com/mocha@10.0.0/mocha.css">
            <script type="module">
                /**
                 * Inject environment variables
                 */
                window.__wdioEnv__ = ${JSON.stringify(env)}
            </script>
            ${vueDeps}
            <script type="module">
            import Mocha from 'https://esm.sh/mocha@10.0.0'
            import HTMLReporter from '@wdio/browser-runner/reporter'
            import { setupHooks } from '@wdio/browser-runner/setup'

            const mochaOpts = ${JSON.stringify(env.args || {})}
            const mocha = Mocha.setup({
                ...mochaOpts,
                reporter: HTMLReporter
            })
            setupHooks(mocha)
            </script>
        </head>
        <body>
            <div id="mocha"></div>
            <script async type="module">
                import { setupEnv, getHook } from '@wdio/browser-runner/setup'
                import { formatMessage } from '@wdio/mocha-framework/common'

                window.__wdioEvents__ = []

                await setupEnv()
                await import('${spec}')

                console.log('[WDIO] Start Mocha testsuite')
                const startTime = Date.now()
                const runner = mocha.run(async (failures) => {
                    await getHook('after')(failures, ${JSON.stringify(env.capabilities)}, ['${spec}'])
                    window.__wdioFailures__ = failures
                })

                runner.suite.beforeAll(() => getHook('beforeSuite')({
                    ...runner.suite.suites[0],
                    file: '${spec}',
                }))
                runner.suite.afterAll(() => getHook('afterSuite')({
                    ...runner.suite.suites[0],
                    file: '${spec}',
                    duration: Date.now() - startTime
                }))
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

export async function getViteConfig (
    options: WebdriverIO.BrowserRunnerOptions,
    root: string,
    port: number
): Promise<[Partial<InlineConfig>, WebSocketServer]> {
    const wsPort = await getPort()
    const wss = new WebSocketServer({ port: wsPort })
    wss.on('connection', (ws) => ws.on('message', handleBrowserCommand(ws)))

    if (options.preset && options.viteConfig) {
        throw new Error('Invalid runner configuration: "preset" and "viteConfig" options are defined but only one of each can be used at the same time')
    }

    let config: Partial<InlineConfig> = {
        configFile: false,
        root,
        server: {
            port,
            host: 'localhost',
            proxy: {
                '/ws': {
                    target: `ws://localhost:${wsPort}`,
                    ws: true
                }
            }
        },
        logLevel: 'silent',
        plugins: [
            testrunner(options),
            topLevelAwait()
        ],
        optimizeDeps: {
            include: ['expect', 'jest-matcher-utils'],
            esbuildOptions: {
                logLevel: 'silent',
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

    if (options.viteConfig) {
        config = deepmerge(config, options.viteConfig)
    } else if (options.preset) {
        const [pkg, importProp, opts] = PRESET_DEPENDENCIES[options.preset] || []
        const plugin = (await userfriendlyImport(options.preset, pkg))[importProp || 'default']
        if (plugin) {
            config.plugins!.push(plugin(opts))
        }
    }

    return [config, wss]
}

function handleBrowserCommand (ws: WebSocket) {
    return async (data: Buffer) => {
        try {
            const payload = JSON.parse(data.toString())
            if (payload.type === 'hook') {
                const session = SESSIONS.get(payload.cid)
                if (!session) {
                    const error = serializeError(new Error(`No session for cid ${payload.cid} found!`))
                    return ws.send(JSON.stringify({ ...payload, error }))
                }

                return executeHooksWithArgs(payload.name, session.config[payload.name as keyof Services.HookFunctions], payload.args).then(
                    () => ws.send(JSON.stringify(payload)),
                    (error: Error) => ws.send(JSON.stringify({ ...payload, error: serializeError(error) }))
                )
            }

            if (payload.type === 'command') {
                log.info(`Received browser message: ${data}`)
                const cid = payload.cid
                if (typeof cid !== 'string') {
                    const error = serializeError(new Error(`No "cid" property passed into command message with id "${payload.id}"`))
                    return ws.send(JSON.stringify({
                        id: payload.id,
                        type: 'command',
                        error
                    }))
                }

                const browser = await BROWSER_POOL.get(payload.cid) as Browser<'async'> | undefined
                if (!browser) {
                    const error = serializeError(new Error(`Couldn't find browser with cid "${payload.cid}"`))
                    return ws.send(JSON.stringify({
                        id: payload.id,
                        type: 'command',
                        error
                    }))
                }

                const result = await (browser[payload.commandName as keyof typeof browser] as Function)(...payload.args)
                const resultMsg = JSON.stringify({ type: 'command', id: payload.id, result })
                log.info(`Return command result: ${resultMsg}`)
                return ws.send(resultMsg)
            }

            throw new Error(`Unknown message type ${payload.type}`)
        } catch (err: any) {
            const error = `Failed handling socket message: ${err.message}`
            log.error(error)
            return ws.send(JSON.stringify(error))
        }
    }
}
