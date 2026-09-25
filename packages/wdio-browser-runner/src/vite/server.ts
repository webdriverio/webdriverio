import path from 'node:path'
import { EventEmitter } from 'node:events'
import { fileURLToPath } from 'node:url'

import getPort from 'get-port'
import logger from '@wdio/logger'
import istanbulPlugin from 'vite-plugin-istanbul'
import { deepmerge } from 'deepmerge-ts'
import { createServer } from 'vite'
import type { ViteDevServer, InlineConfig, ConfigEnv, Plugin } from 'vite'

import { testrunner } from './plugins/testrunner.js'
import { mockHoisting } from './plugins/mockHoisting.js'
import { workerPlugin, type SocketEventHandler } from './plugins/worker.js'
import { userfriendlyImport } from './utils.js'
import { MockHandler } from './mock.js'
import { PRESET_DEPENDENCIES, DEFAULT_VITE_CONFIG } from './constants.js'
import { DEFAULT_INCLUDE, DEFAULT_FILE_EXTENSIONS } from '../constants.js'

const log = logger('@wdio/browser-runner:ViteServer')

function specToViteUrl(specPath: string, root: string) {
    const relative = path.relative(root, specPath)
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        const fsPath = specPath.split(path.sep).join('/')
        return `/@fs${fsPath.startsWith('/') ? '' : '/'}${fsPath}`
    }
    return `/${relative.split(path.sep).join('/')}`
}

const DEFAULT_CONFIG_ENV: ConfigEnv = {
    command: 'serve',
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development'
}

/**
 * Class that sets up the Vite server with correct configuration based on given WebdriverIO options.
 */
export class ViteServer extends EventEmitter {
    #options: WebdriverIO.BrowserRunnerOptions
    #config: WebdriverIO.Config
    #viteConfig: Partial<InlineConfig>
    #server?: ViteDevServer
    #mockHandler: MockHandler
    #hoisting: Plugin[] & { prime?: (specPath: string) => void } = []
    #socketEventHandler: SocketEventHandler[] = []

    get config () {
        return this.#viteConfig
    }

    constructor (options: WebdriverIO.BrowserRunnerOptions, config: WebdriverIO.Config, optimizations: InlineConfig) {
        super()
        this.#options = options
        this.#config = config
        this.#mockHandler = new MockHandler(options, config)

        const root = options.rootDir || config.rootDir || process.cwd()
        this.#hoisting = mockHoisting(this.#mockHandler)
        this.#viteConfig = deepmerge(DEFAULT_VITE_CONFIG, optimizations, {
            root,
            plugins: [
                testrunner(options),
                this.#hoisting,
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
                ...options.coverage,
                exclude: [
                    '**/node_modules/**',
                    '**/.git/**',
                    '**/.github/**',
                    '**/.nuxt/**',
                    '**/.output/**',
                    '**/.dist/**',
                    '**/.cache/**',
                    '**/packages/wdio-browser-runner/**',
                    '**/packages/wdio-utils/**',
                    '../packages/wdio-browser-runner/**',
                    '../packages/wdio-utils/**',
                    '**/*.test.*',
                    '**/*.spec.*',
                    ...(Array.isArray(options.coverage.exclude) ? options.coverage.exclude : [])
                ]
            }))
        }
    }

    onBrowserEvent (handler: SocketEventHandler) {
        this.#socketEventHandler.push(handler)
    }

    async start () {
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
         * merge custom port into Vite config last
         */
        const vitePort = await getPort()
        this.#viteConfig = deepmerge(this.#viteConfig, <Partial<InlineConfig>>{
            server: {
                ...this.#viteConfig.server,
                port: vitePort
            }
        })

        /**
         * initialize Vite
         */
        this.#server = await createServer(this.#viteConfig)
        await this.#server.listen()
        log.info(`Vite server started successfully on port ${vitePort}, root directory: ${this.#viteConfig.root}`)
        await this.#prebundleSpecs()

        return vitePort
    }

    /**
     * Discover dependency optimizations before the browser connects. Vite
     * otherwise reloads the page once it finds them, and Safari often never
     * evaluates modules after that reload.
     */
    async #prebundleSpecs() {
        const server = this.#server
        const environment = server?.environments?.client
        if (!server || !environment?.transformRequest) {
            return
        }

        const specs = [this.#config.specs].flat(2).filter((entry): entry is string => typeof entry === 'string')
        const root = this.#viteConfig.root || process.cwd()
        const specPaths = specs.map((spec) => spec.startsWith('file:') ? fileURLToPath(spec) : spec)
        if (!specPaths.length) {
            return
        }

        const sharedUrls = [
            '@wdio/browser-runner/setup',
            '@wdio/browser-runner/third_party/mocha.js'
        ]
        /**
         * Specs rewrite static imports into `import()` so mocks can run
         * first. Vite only pre-transforms static imports, so follow the
         * dynamic ones or their dependencies show up after the browser
         * has already loaded the page.
         *
         * Prime one spec at a time. Priming every spec up front leaves only
         * the last one active, and earlier specs are then cached without
         * their mocks hoisted.
         */
        const crawl = async (startUrls: string[]) => {
            const visited = new Set<string>()
            const queue = [...startUrls]
            while (queue.length) {
                const url = queue.shift()!
                if (!url || visited.has(url) || url.includes('node_modules') || url.includes('\0')) {
                    continue
                }
                visited.add(url)
                try {
                    await environment.transformRequest(url)
                    await Promise.race([
                        environment.waitForRequestsIdle(),
                        new Promise((resolve) => setTimeout(resolve, 10000))
                    ])
                    const mod = await environment.moduleGraph.getModuleByUrl(url)
                    for (const imported of mod?.importedModules ?? []) {
                        if (imported.url && !visited.has(imported.url)) {
                            queue.push(imported.url)
                        }
                    }
                } catch (err) {
                    log.debug(`Failed to prebundle ${url}: ${(err as Error).message}`)
                }
            }
        }

        let seen = ''
        for (let pass = 0; pass < 4; pass++) {
            await crawl(sharedUrls)
            for (const specPath of specPaths) {
                this.#hoisting.prime?.(specPath)
                await crawl([specToViteUrl(specPath, root)])
            }
            await new Promise((resolve) => setTimeout(resolve, 400))
            const optimized = Object.keys(environment.depsOptimizer?.metadata.optimized ?? {}).sort().join('\n')
            if (optimized && optimized === seen) {
                break
            }
            seen = optimized
        }
    }

    async close () {
        await this.#server?.close()
    }
}
