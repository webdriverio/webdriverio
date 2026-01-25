import { builtinModules, createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'esbuild'

/**
 * Browser Polyfills Plugin for WebdriverIO
 *
 * Implements a two-category approach to Node.js compatibility:
 * 1. REAL POLYFILLS: Use NPM packages (events, path-browserify) or custom implementations
 * 2. HARD ERROR MOCKS: Throw descriptive errors (fs, child_process, etc.)
 *
 * @see https://github.com/webdriverio/webdriverio/issues/14598
 */

const __dirname = dirname(fileURLToPath(import.meta.url))
const polyfillsDir = join(__dirname, '..', 'polyfills')

// Create require function for ESM to resolve NPM packages
const require = createRequire(import.meta.url)

/**
 * Load polyfill content from a file
 */
function loadPolyfill(filename: string): string {
    return readFileSync(join(polyfillsDir, filename), 'utf-8')
}

/**
 * Category A: Modules that get REAL polyfills
 * - events and path use NPM packages (resolved by esbuild)
 * - others use custom implementations loaded from files
 */
const POLYFILLED_BUILTINS_FROM_FILES: Record<string, string> = {
    'process': 'process.js',
    'buffer': 'buffer.js',
    'util': 'util.js',
    'url': 'url.js',
    'assert': 'assert.js'
}

/**
 * Modules that should be resolved to NPM packages
 */
const NPM_POLYFILL_PACKAGES: Record<string, string> = {
    'events': 'events',
    'path': 'path-browserify'
}

/**
 * Category B: Modules that throw descriptive errors (truly Node-only)
 * Note: We only check the base module name, not subpaths (e.g., 'fs' covers 'fs/promises')
 */
const HARD_ERROR_BUILTINS = [
    'fs',
    'child_process',
    'worker_threads',
    'cluster',
    'net',
    'tls',
    'dgram',
    'dns',
    'http2',
    'inspector',
    'readline',
    'repl',
    'vm',
    'v8',
    'perf_hooks',
    'trace_events',
    'async_hooks',
    'stream',
    'constants',
    'module',
    'os',
    'tty',
    'zlib',
    'timers',
    'console',
    'crypto',
    'http',
    'https'
]

/**
 * NPM packages that should be mocked (Node-only dependencies)
 */
const MOCKED_PACKAGES = [
    'puppeteer-core',
    '@puppeteer/browsers',
    'geckodriver',
    'safaridriver',
    'edgedriver',
    'locate-app',
    'wait-port',
    'archiver',
    'jszip',
    'glob',
    'import-meta-resolve',
    '@wdio/repl',
    'ws'
]

export { POLYFILLED_BUILTINS_FROM_FILES, NPM_POLYFILL_PACKAGES, HARD_ERROR_BUILTINS, MOCKED_PACKAGES }

/**
 * Creates an esbuild plugin for browser builds with proper polyfill strategy.
 *
 * @example
 * ```ts
 * import { browserPolyfills } from './polyfill.js'
 * esbuild.build({
 *     platform: 'browser',
 *     plugins: [browserPolyfills()]
 * })
 * ```
 */
export function browserPolyfills(): Plugin {
    return {
        name: 'wdio-browser-polyfills',
        setup(build) {
            // Only apply polyfills for browser platform builds
            if (build.initialOptions.platform !== 'browser') {
                return
            }

            // Handle Node.js built-in modules (includes digits for http2, v8, etc.)
            build.onResolve({ filter: /^(node:)?[a-z0-9_-]+(\/.*)?$/ }, (args) => {
                const moduleName = args.path.replace(/^node:/, '').split('/')[0]
                const subpath = args.path.replace(/^node:/, '').includes('/')
                    ? args.path.replace(/^node:/, '').split('/').slice(1).join('/')
                    : null

                // Check if this should use an NPM package
                if (moduleName in NPM_POLYFILL_PACKAGES) {
                    const packageName = NPM_POLYFILL_PACKAGES[moduleName]
                    try {
                        return {
                            path: require.resolve(packageName),
                            external: false
                        }
                    } catch (err) {
                        const error = err as NodeJS.ErrnoException
                        if (error.code === 'MODULE_NOT_FOUND') {
                            throw new Error(
                                `Failed to resolve polyfill package "${packageName}" for module "${moduleName}". ` +
                                `Please install it: pnpm add ${packageName}`
                            )
                        }
                        throw err
                    }
                }

                // Check if this builtin has a file-based polyfill
                // Also route subpaths to the same namespace (e.g., 'util/types' -> wdio-polyfill)
                if (moduleName in POLYFILLED_BUILTINS_FROM_FILES) {
                    return {
                        path: subpath ? `wdio-polyfill-${moduleName}/${subpath}` : `wdio-polyfill-${moduleName}`,
                        namespace: 'wdio-polyfill'
                    }
                }

                // Check if this builtin should throw hard errors
                if (HARD_ERROR_BUILTINS.includes(moduleName) || builtinModules.includes(moduleName)) {
                    return {
                        path: args.path,
                        namespace: 'wdio-hard-error'
                    }
                }

                return null
            })

            // Handle mocked NPM packages (optimized filter for performance)
            const mockedPackagesPattern = new RegExp(`^(${MOCKED_PACKAGES.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(/|$)`)
            build.onResolve({ filter: mockedPackagesPattern }, (args) => {
                // Handle scoped packages (e.g., @puppeteer/browsers) correctly
                const packageName = args.path.startsWith('@')
                    ? args.path.split('/').slice(0, 2).join('/')
                    : args.path.split('/')[0]
                if (MOCKED_PACKAGES.includes(packageName) || MOCKED_PACKAGES.includes(args.path)) {
                    return {
                        path: args.path,
                        namespace: 'wdio-mock-package'
                    }
                }
                return null
            })

            // Load polyfills from files
            build.onLoad({ filter: /.*/, namespace: 'wdio-polyfill' }, (args) => {
                const moduleName = args.path.replace('wdio-polyfill-', '')
                // Extract base module for subpath imports (e.g., 'util/types' -> 'util')
                const baseModule = moduleName.split('/')[0]
                const filename = POLYFILLED_BUILTINS_FROM_FILES[baseModule]

                if (filename) {
                    try {
                        const contents = loadPolyfill(filename)
                        return {
                            contents,
                            loader: 'js'
                        }
                    } catch (err) {
                        return {
                            errors: [{
                                text: `Failed to load polyfill for ${moduleName}: ${err}`
                            }]
                        }
                    }
                }

                // Fallback for subpaths without a polyfill file
                return {
                    contents: 'export default {};',
                    loader: 'js'
                }
            })

            // Load hard error mocks
            build.onLoad({ filter: /.*/, namespace: 'wdio-hard-error' }, (args) => ({
                contents: `
                    const moduleName = "${args.path}";
                    const createError = (method) => () => {
                        throw new Error(\`\${moduleName}.\${method}() is not available in browser environments. This module requires Node.js.\`);
                    };
                    export default new Proxy({}, {
                        get: (_target, prop) => createError(prop)
                    });
                `,
                loader: 'js'
            }))

            // Load mocked NPM packages
            build.onLoad({ filter: /.*/, namespace: 'wdio-mock-package' }, (args) => ({
                contents: `
                    // Mocked: ${args.path} (not available in browser)
                    export default {};
                `,
                loader: 'js'
            }))
        }
    }
}
