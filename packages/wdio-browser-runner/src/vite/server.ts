import path from 'node:path'
import { EventEmitter } from 'node:events'

import getPort from 'get-port'
import logger from '@wdio/logger'
import istanbulPlugin from 'vite-plugin-istanbul'
import { deepmerge } from 'deepmerge-ts'
import { createServer } from 'vite'
import type { ViteDevServer, InlineConfig, ConfigEnv } from 'vite'
import type { Options } from '@wdio/types'

import { testrunner } from './plugins/testrunner.js'
import { mockHoisting } from './plugins/mockHoisting.js'
import { workerPlugin, type SocketEventHandler } from './plugins/worker.js'
import { userfriendlyImport } from './utils.js'
import { MockHandler } from './mock.js'
import { PRESET_DEPENDENCIES, DEFAULT_VITE_CONFIG } from './constants.js'
import { DEFAULT_INCLUDE, DEFAULT_FILE_EXTENSIONS } from '../constants.js'

const log = logger('@wdio/browser-runner:ViteServer')
const DEFAULT_CONFIG_ENV: ConfigEnv = {
    command: 'serve',
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development'
}

/**
 * Class that sets up the Vite server with correct configuration based on given WebdriverIO options.
 */
export class ViteServer extends EventEmitter {
    #options: WebdriverIO.BrowserRunnerOptions
    #config: Options.Testrunner
    #viteConfig: Partial<InlineConfig>
    #server?: ViteDevServer
    #mockHandler: MockHandler
    #socketEventHandler: SocketEventHandler[] = []

    get config () {
        return this.#viteConfig
    }

    constructor (options: WebdriverIO.BrowserRunnerOptions, config: Options.Testrunner, optimizations: InlineConfig) {
        super()
        this.#options = options
        this.#config = config
        this.#mockHandler = new MockHandler(options, config)

        const root = options.rootDir || config.rootDir || process.cwd()
        this.#viteConfig = deepmerge(DEFAULT_VITE_CONFIG, optimizations, {
            root,
            plugins: [
                testrunner(options),
                mockHoisting(this.#mockHandler),
                workerPlugin((payload, client) => (
                    this.#socketEventHandler.forEach(
                        (handler) => handler(payload, client)
                    )
                ))
            ]
        })

        if (options.coverage && options.coverage.enabled) {
            log.info('Capturing test coverage enabled')
            // @ts-expect-error istanbul plugin seems to incorrectly export
            // its type for our setup
            const plugin = istanbulPlugin as typeof istanbulPlugin.default
            this.#viteConfig.plugins?.push(plugin({
                cwd: config.rootDir,
                include: DEFAULT_INCLUDE,
                extension: DEFAULT_FILE_EXTENSIONS,
                forceBuildInstrument: true,
                ...options.coverage
            }))
        }
    }

    onBrowserEvent (handler: SocketEventHandler) {
        this.#socketEventHandler.push(handler)
    }

    async start () {
        const vitePort = await getPort()
        this.#viteConfig = deepmerge(this.#viteConfig, <Partial<InlineConfig>>{
            server: {
                ...this.#viteConfig.server,
                port: vitePort
            }
        })

        /**
         * load additional Vite plugins for framework
         */
        if (this.#options.preset) {
            const [pkg, importProp, opts] = PRESET_DEPENDENCIES[this.#options.preset] || []
            const plugin = (await userfriendlyImport(this.#options.preset, pkg))[importProp || 'default']
            if (plugin) {
                this.#viteConfig.plugins!.push(plugin(opts))
            }
        }

        /**
         * merge custom `viteConfig` last into the object
         */
        if (this.#options.viteConfig) {
            const { plugins, ...configToMerge } = typeof this.#options.viteConfig === 'string'
                ? (
                    await import(path.resolve(this.#config.rootDir || process.cwd(), this.#options.viteConfig))
                ).default as InlineConfig
                : typeof this.#options.viteConfig === 'function'
                    ? await this.#options.viteConfig(DEFAULT_CONFIG_ENV)
                    : this.#options.viteConfig
            this.#viteConfig = deepmerge(this.#viteConfig, configToMerge)
            this.#viteConfig.plugins = [...(plugins || []), ...this.#viteConfig.plugins!]
        }

        /**
         * initialize Vite
         */
        this.#server = await createServer(this.#viteConfig)
        await this.#server.listen()
        log.info(`Vite server started successfully on port ${vitePort}, root directory: ${this.#viteConfig.root}`)

        return vitePort
    }

    async close () {
        await this.#server?.close()
    }
}
