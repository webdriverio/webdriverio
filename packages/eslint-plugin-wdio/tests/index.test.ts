import { expect, test } from 'vitest'
import index from '../src/index.js'
import pkg from '../package.json' with { type: 'json' }
import plugin from '../src/plugin.js'

test('should export proper plugin configuration', () => {
    const rules = {
        'wdio/await-expect': 'off',
        'wdio/no-debug': 'error',
        'wdio/no-pause': 'error',
        'wdio/no-floating-promise': 'error'
    }

    const globals = {
        '$': false,
        '$$': false,
        'AbortController': false,
        'AbortSignal': false,
        'AsyncDisposableStack': false,
        'Blob': false,
        'BroadcastChannel': false,
        'Buffer': false,
        'ByteLengthQueuingStrategy': false,
        'CloseEvent': false,
        'CompressionStream': false,
        'CountQueuingStrategy': false,
        'Crypto': false,
        'CryptoKey': false,
        'CustomEvent': false,
        'DOMException': false,
        'DecompressionStream': false,
        'DisposableStack': false,
        'ErrorEvent': false,
        'Event': false,
        'EventTarget': false,
        'File': false,
        'FormData': false,
        'Headers': false,
        'MessageChannel': false,
        'MessageEvent': false,
        'MessagePort': false,
        'Navigator': false,
        'Performance': false,
        'PerformanceEntry': false,
        'PerformanceMark': false,
        'PerformanceMeasure': false,
        'PerformanceObserver': false,
        'PerformanceObserverEntryList': false,
        'PerformanceResourceTiming': false,
        'ReadableByteStreamController': false,
        'ReadableStream': false,
        'ReadableStreamBYOBReader': false,
        'ReadableStreamBYOBRequest': false,
        'ReadableStreamDefaultController': false,
        'ReadableStreamDefaultReader': false,
        'Request': false,
        'Response': false,
        'Storage': false,
        'SubtleCrypto': false,
        'SuppressedError': false,
        'TextDecoder': false,
        'TextDecoderStream': false,
        'TextEncoder': false,
        'TextEncoderStream': false,
        'TransformStream': false,
        'TransformStreamDefaultController': false,
        'URL': false,
        'URLPattern': false,
        'URLSearchParams': false,
        'WebAssembly': false,
        'WebSocket': false,
        'WritableStream': false,
        'WritableStreamDefaultController': false,
        'WritableStreamDefaultWriter': false,
        '__dirname': false,
        '__filename': false,
        'after': false,
        'afterEach': false,
        'atob': false,
        'before': false,
        'beforeEach': false,
        'browser': false,
        'btoa': false,
        'clearImmediate': false,
        'clearInterval': false,
        'clearTimeout': false,
        'console': false,
        'context': false,
        'crypto': false,
        'describe': false,
        'driver': false,
        'expect': false,
        'exports': true,
        'fetch': false,
        'global': false,
        'it': false,
        'localStorage': false,
        'mocha': false,
        'module': false,
        'multiRemoteBrowser': false,
        'multiremotebrowser': false,
        'navigator': false,
        'performance': false,
        'process': false,
        'queueMicrotask': false,
        'require': false,
        'run': false,
        'sessionStorage': false,
        'setImmediate': false,
        'setInterval': false,
        'setTimeout': false,
        'setup': false,
        'specify': false,
        'structuredClone': false,
        'suite': false,
        'suiteSetup': false,
        'suiteTeardown': false,
        'teardown': false,
        'test': false,
        'xcontext': false,
        'xdescribe': false,
        'xit': false,
        'xspecify': false,
    }

    expect(index).toEqual({
        meta: {
            name: 'eslint-plugin-wdio',
            version: pkg.version
        },
        configs: {
            'flat/recommended': {
                languageOptions: {
                    globals: globals,
                    parser: expect.any(Object),
                    parserOptions: {
                        projectService: true,
                    },
                },
                plugins: {
                    wdio: {
                        configs: {},
                        rules: {
                            'await-expect': expect.any(Object),
                            'no-debug': expect.any(Object),
                            'no-pause': expect.any(Object),
                            'no-floating-promise': expect.any(Object)
                        }
                    },
                },
                rules,
                ignores: [
                    'eslint.config.js',
                    'eslint.config.cjs',
                    'eslint.config.mjs'
                ],
            },
            recommended: {
                rules: {
                    'wdio/await-expect': 'error',
                    'wdio/no-debug': 'error',
                    'wdio/no-pause': 'error',
                },
                globals: globals,
                plugins: ['wdio'],
            }
        },
        rules
    })
})

