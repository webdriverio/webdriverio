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
    'path': 'path-browserify',
    'querystring': 'querystring-es3'
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
    'ws',
    'graceful-fs'
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
                        /**
                         * Robustly resolve the NPM package's entry point.
                         * Simple require.resolve(packageName) can return a core module name (e.g., 'events')
                         * or a relative path, which confuses esbuild.
                         */
                        const pkgJsonPath = require.resolve(`${packageName}/package.json`, {
                            paths: [join(__dirname, '..')]
                        })
                        const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
                        const pkgDir = dirname(pkgJsonPath)

                        // Pick the best entry point for the browser
                        const entryPoint = pkgJson.browser || pkgJson.module || pkgJson.main || 'index.js'
                        const resolvedPath = require.resolve(join(pkgDir, entryPoint))
                        return {
                            path: resolvedPath,
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

            build.onLoad({ filter: /.*/, namespace: 'wdio-hard-error' }, (args) => {
                const moduleName = args.path
                let namedExports = ''

                try {
                    // Inspect the actual Node.js module to generate named exports
                    // This allows named imports like `import { existsSync } from 'fs'` to work in the bundle
                    const realModule = require(moduleName)
                    const keys = Object.keys(realModule).filter(k =>
                        // Filter out default and invalid identifiers
                        k !== 'default' && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k)
                    )
                    namedExports = keys.map(k => `export const ${k} = createError("${k}");`).join('\n')
                } catch {
                    // Fallback if module cannot be required
                    namedExports = '// No named exports found'
                }

                return {
                    contents: `
                        const moduleName = "${moduleName}";
                        const createError = (method) => () => {
                            throw new Error(\`\${moduleName}.\${method}() is not available in browser environments. This module requires Node.js.\`);
                        };
                        ${namedExports}
                        export default new Proxy({}, {
                            get: (_target, prop) => createError(prop)
                        })
                    `,
                    loader: 'js'
                }
            })

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
