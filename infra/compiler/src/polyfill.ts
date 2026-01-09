import { builtinModules } from 'node:module'
import type { Plugin } from 'esbuild'

/**
 * Browser Polyfills Plugin for WebdriverIO
 *
 * Implements a two-category approach to Node.js compatibility:
 * 1. REAL POLYFILLS: Provide compatible implementations (process, buffer, events)
 * 2. HARD ERROR MOCKS: Throw descriptive errors (fs, child_process, etc.)
 *
 * @see https://github.com/webdriverio/webdriverio/issues/14598
 */

/**
 * Category A: Modules that get REAL polyfills with compatible implementations
 */
const POLYFILLED_BUILTINS: Record<string, string> = {
    'process': `
        // Minimal process polyfill for browser
        export const env = {};
        export const platform = 'browser';
        export const version = '';
        export const versions = {};
        export const cwd = () => '/';
        export const nextTick = (fn, ...args) => setTimeout(() => fn(...args), 0);
        export const stdout = { write: () => {} };
        export const stderr = { write: () => {} };
        export default { env, platform, version, versions, cwd, nextTick, stdout, stderr };
    `,
    'buffer': `
        // Buffer polyfill - implementation for WebdriverIO needs
        class BufferPolyfill {
            static from(data, encoding) {
                if (typeof data === 'string') {
                    if (encoding === 'base64') {
                        // Decode base64 string
                        const binary = atob(data);
                        const bytes = new Uint8Array(binary.length);
                        for (let i = 0; i < binary.length; i++) {
                            bytes[i] = binary.charCodeAt(i);
                        }
                        return bytes;
                    }
                    if (encoding === 'hex') {
                        // Decode hex string
                        const bytes = new Uint8Array(data.length / 2);
                        for (let i = 0; i < bytes.length; i++) {
                            bytes[i] = parseInt(data.substring(i * 2, i * 2 + 2), 16);
                        }
                        return bytes;
                    }
                    // Default: UTF-8 encoding
                    return new TextEncoder().encode(data);
                }
                return new Uint8Array(data);
            }
            static alloc(size) {
                return new Uint8Array(size);
            }
            static isBuffer(obj) {
                return obj instanceof Uint8Array;
            }
            static concat(list) {
                const totalLength = list.reduce((acc, arr) => acc + arr.length, 0);
                const result = new Uint8Array(totalLength);
                let offset = 0;
                for (const arr of list) {
                    result.set(arr, offset);
                    offset += arr.length;
                }
                return result;
            }
            static toString(buf, encoding) {
                if (encoding === 'base64') {
                    // Use loop to avoid stack overflow on large buffers
                    let binary = '';
                    for (let i = 0; i < buf.length; i++) {
                        binary += String.fromCharCode(buf[i]);
                    }
                    return btoa(binary);
                }
                return new TextDecoder().decode(buf);
            }
        }
        export const Buffer = BufferPolyfill;
        export default { Buffer: BufferPolyfill };
    `,
    'events': `
        // EventEmitter polyfill for browser
        class EventEmitter {
            constructor() {
                this._events = {};
                this._maxListeners = 10;
            }
            on(event, listener) {
                if (!this._events[event]) this._events[event] = [];
                this._events[event].push(listener);
                return this;
            }
            once(event, listener) {
                const onceWrapper = (...args) => {
                    this.off(event, onceWrapper);
                    listener.apply(this, args);
                };
                onceWrapper.listener = listener;
                return this.on(event, onceWrapper);
            }
            off(event, listener) {
                if (!this._events[event]) return this;
                this._events[event] = this._events[event].filter(
                    l => l !== listener && l.listener !== listener
                );
                return this;
            }
            removeListener(event, listener) {
                return this.off(event, listener);
            }
            removeAllListeners(event) {
                if (event) {
                    delete this._events[event];
                } else {
                    this._events = {};
                }
                return this;
            }
            emit(event, ...args) {
                if (!this._events[event]) return false;
                this._events[event].forEach(listener => listener.apply(this, args));
                return true;
            }
            listeners(event) {
                return this._events[event] || [];
            }
            listenerCount(event) {
                return (this._events[event] || []).length;
            }
            setMaxListeners(n) {
                this._maxListeners = n;
                return this;
            }
            getMaxListeners() {
                return this._maxListeners;
            }
            addListener(event, listener) {
                return this.on(event, listener);
            }
            prependListener(event, listener) {
                if (!this._events[event]) this._events[event] = [];
                this._events[event].unshift(listener);
                return this;
            }
        }
        export { EventEmitter };
        export default EventEmitter;
    `,
    'util': `
        // Minimal util polyfill
        export const promisify = (fn) => (...args) => new Promise((resolve, reject) => {
            fn(...args, (err, result) => err ? reject(err) : resolve(result));
        });
        export const deprecate = (fn) => fn;
        export const inherits = (ctor, superCtor) => {
            ctor.super_ = superCtor;
            Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
        };
        export const format = (...args) => args.join(' ');
        export const inspect = (obj) => JSON.stringify(obj, null, 2);
        export default { promisify, deprecate, inherits, format, inspect };
    `,
    'url': `
        // URL module - use native browser URL
        export const URL = globalThis.URL;
        export const URLSearchParams = globalThis.URLSearchParams;
        export const fileURLToPath = (url) => {
            if (typeof url === 'string') {
                return url.replace('file://', '');
            }
            return url.pathname;
        };
        export const pathToFileURL = (path) => new URL('file://' + path);
        export default { URL, URLSearchParams, fileURLToPath, pathToFileURL };
    `,
    'path': `
        // Path polyfill for browser (CommonJS for compatibility with all loaders)
        var sep = '/';
        var delimiter = ':';
        
        var splitPath = function(filename) {
            return filename.split(new RegExp('/+')).filter(function(p) { return !!p; });
        };
        
        var normalizeArray = function(parts, allowAboveRoot) {
            var up = 0;
            for (var i = parts.length - 1; i >= 0; i--) {
                var last = parts[i];
                if (last === '.') {
                    parts.splice(i, 1);
                } else if (last === '..') {
                    parts.splice(i, 1);
                    up++;
                } else if (up) {
                    parts.splice(i, 1);
                    up--;
                }
            }
            if (allowAboveRoot) {
                for (; up--; up) {
                    parts.unshift('..');
                }
            }
            return parts;
        };

        var resolve = function() {
            var resolvedPath = '';
            var resolvedAbsolute = false;
            
            for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
                var path = (i >= 0) ? arguments[i] : '/';
                
                // Skip non-string arguments
                if (typeof path !== 'string') {
                    throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
                } else if (path.length === 0) {
                    continue;
                }
                
                resolvedPath = path + '/' + resolvedPath;
                resolvedAbsolute = path.charAt(0) === '/';
            }
            
            // At this point the path should be resolved to a full absolute path, but
            // handle relative paths to be safe (though in browser we force root)
            resolvedPath = normalizeArray(splitPath(resolvedPath), !resolvedAbsolute).join('/');
            
            return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
        };
        
        var normalize = function(path) {
            var isAbsolute = path.charAt(0) === '/';
            var trailingSlash = path && path[path.length - 1] === '/';
            
            path = normalizeArray(splitPath(path), !isAbsolute).join('/');
            
            if (!path && !isAbsolute) {
                path = '.';
            }
            if (path && trailingSlash) {
                path += '/';
            }
            
            return (isAbsolute ? '/' : '') + path;
        };
        
        var isAbsolute = function(path) {
            return path.charAt(0) === '/';
        };
        
        var join = function() {
            var paths = [];
            for (var i = 0; i < arguments.length; i++) {
                var arg = arguments[i];
                if (typeof arg !== 'string') {
                    throw new TypeError('Args must be strings');
                }
                if (arg) {
                    paths.push(arg);
                }
            }
            return normalize(paths.join('/'));
        };
        
        var relative = function(from, to) {
            from = resolve(from).substr(1);
            to = resolve(to).substr(1);
            
            var fromParts = splitPath(from);
            var toParts = splitPath(to);
            
            var length = Math.min(fromParts.length, toParts.length);
            var samePartsLength = length;
            for (var i = 0; i < length; i++) {
                if (fromParts[i] !== toParts[i]) {
                    samePartsLength = i;
                    break;
                }
            }
            
            var outputParts = [];
            for (var i = samePartsLength; i < fromParts.length; i++) {
                outputParts.push('..');
            }
            
            outputParts = outputParts.concat(toParts.slice(samePartsLength));
            
            return outputParts.join('/');
        };
        
        var dirname = function(path) {
            var result = resolve(path).replace(new RegExp('/[^/]*$'), '');
            return result === '' ? '/' : result;
        };
        
        var basename = function(path, ext) {
           var f = splitPath(path).pop() || '';
           if (ext && f.substr(-1 * ext.length) === ext) {
               f = f.substr(0, f.length - ext.length);
           }
           return f;
        };
        
        var extname = function(path) {
            var f = basename(path);
            var i = f.lastIndexOf('.');
            if (i === -1 || i === 0) return '';
            return f.substr(i);
        };
        
        var parse = function(path) {
            var ret = { root: '', dir: '', base: '', ext: '', name: '' };
            if (path.length === 0) return ret;
            var isAbsolute = path.charCodeAt(0) === 47; /* / */
            if (isAbsolute) {
                ret.root = '/';
            }
            ret.base = basename(path);
            ret.ext = extname(ret.base);
            ret.name = ret.base.slice(0, ret.base.length - ret.ext.length);
            ret.dir = dirname(path);
            return ret;
        };
        
        var posix = { sep, delimiter, resolve, normalize, isAbsolute, join, relative, dirname, basename, extname, parse };
        
        module.exports = { sep, delimiter, resolve, normalize, isAbsolute, join, relative, dirname, basename, extname, parse, posix, default: posix };
    `
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
    'async_hooks'
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

export { POLYFILLED_BUILTINS, HARD_ERROR_BUILTINS, MOCKED_PACKAGES }

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

            // Handle Node.js built-in modules
            build.onResolve({ filter: /^(node:)?[a-z_-]+(\/.*)?$/ }, (args) => {
                const moduleName = args.path.replace(/^node:/, '').split('/')[0]

                // Check if this builtin has a polyfill
                if (moduleName in POLYFILLED_BUILTINS) {
                    return {
                        path: `wdio-polyfill-${moduleName}`,
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

            // Load real polyfills
            build.onLoad({ filter: /.*/, namespace: 'wdio-polyfill' }, (args) => {
                const moduleName = args.path.replace('wdio-polyfill-', '')
                const polyfill = POLYFILLED_BUILTINS[moduleName]

                if (polyfill) {
                    return {
                        contents: polyfill,
                        loader: 'ts'
                    }
                }

                // Fallback for subpaths
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
