
/**
 *
 * This command helps you to debug your integration tests. It stops the running browser and gives
 * you time to jump into it and check the state of your application (e.g. using dev tools).
 * Your terminal transforms into a [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop)
 * interface that will allow you to try out certain commands, find elements and test actions on
 * them.
 *
 * [![WebdriverIO REPL](https://webdriver.io/img/repl.gif)](https://webdriver.io/img/repl.gif)
 *
 * If you run the WDIO testrunner make sure you increase the timeout property of the test framework
 * you are using (e.g. Mocha or Jasmine) in order to prevent test termination due to a test timeout.
 * Also avoid executing the command with multiple capabilities running at the same time.
 *
 * <iframe width="560" height="315" src="https://www.youtube.com/embed/xWwP-3B_YyE" frameBorder="0" allowFullScreen></iframe>
 *
 * <example>
    :debug.js
    it('should demonstrate the debug command', () => {
        $('#input').setValue('FOO')
        browser.debug() // jumping into the browser and change value of #input to 'BAR'
        const value = $('#input').getValue()
        console.log(value) // outputs: "BAR"
    })
 * </example>
 *
 * @alias browser.debug
 * @type utility
 *
 */

import module from 'node:module'
import path from 'node:path'
import util from 'node:util'
import vm from 'node:vm'
import repl from 'node:repl'

import { STATIC_RETURNS, INTRO_MESSAGE, DEFAULT_CONFIG } from './constants.js'

export interface ReplConfig {
    commandTimeout: number
    eval: repl.REPLEval
    prompt: string
    useGlobal: boolean
    useColor: boolean
    baseDir?: string
}

export interface CreateReplContextOptions {
    baseDir?: string
}

export type ReplCallback = (err: Error | null, result: unknown) => void

let vmIntrinsicKeys: Set<PropertyKey> | undefined

/**
 * Collect property keys that V8 already creates on a fresh VM context so we
 * copy Node.js runtime globals (process, Buffer, URL, fetch, etc.) without
 * shadowing realm-local JS intrinsics such as Array or Error.
 */
function getVmIntrinsicKeys (): Set<PropertyKey> {
    if (vmIntrinsicKeys) {
        return vmIntrinsicKeys
    }

    try {
        const bare = vm.createContext({})
        const keys = vm.runInContext('Reflect.ownKeys(globalThis)', bare)
        if (Array.isArray(keys)) {
            vmIntrinsicKeys = new Set(keys as PropertyKey[])
            return vmIntrinsicKeys
        }
    } catch {
        // Fallback when `vm` is mocked in unit tests
    }

    return new Set()
}

/**
 * Create a REPL execution context with access to the local Node.js runtime
 * environment (Node globals, `require` resolved from `baseDir`, and any
 * existing globals on `globalThis`) plus optional caller-provided locals,
 * without mutating the outer `globalThis`.
 */
export function createReplContext (
    locals: Record<string, unknown> = {},
    options: CreateReplContextOptions = {}
): vm.Context {
    const baseDir = options.baseDir || process.cwd()
    const intrinsics = getVmIntrinsicKeys()
    const ctx: Record<PropertyKey, unknown> = {}

    for (const key of Reflect.ownKeys(globalThis)) {
        if (key === 'global' || key === 'globalThis') {
            continue
        }
        if (Object.prototype.hasOwnProperty.call(locals, key)) {
            continue
        }
        /**
         * Keep Node's `console` even though V8 defines its own bare console
         * inside a VM context, because V8's default console does not write to
         * Node's stdout/stderr.
         */
        if (intrinsics.has(key) && key !== 'console') {
            continue
        }

        const desc = Object.getOwnPropertyDescriptor(globalThis, key)
        if (!desc) {
            continue
        }

        const nextDesc: PropertyDescriptor = desc.get || desc.set
            ? {
                enumerable: desc.enumerable,
                configurable: true,
                get: desc.get ? () => Reflect.apply(desc.get!, globalThis, []) : undefined,
                set: (value: unknown) => {
                    Object.defineProperty(ctx, key, {
                        value,
                        writable: true,
                        enumerable: true,
                        configurable: true
                    })
                }
            }
            : {
                ...desc,
                configurable: true
            }

        try {
            Object.defineProperty(ctx, key, nextDesc)
        } catch {
            // Ignore non-redefinable host properties
        }
    }

    ctx.global = ctx

    if (
        !Object.prototype.hasOwnProperty.call(ctx, 'require') &&
        !Object.prototype.hasOwnProperty.call(locals, 'require')
    ) {
        ctx.require = module.createRequire(path.join(baseDir, 'noop.js'))
    }

    for (const key of Reflect.ownKeys(locals)) {
        const desc = Object.getOwnPropertyDescriptor(locals, key)
        if (desc) {
            Object.defineProperty(ctx, key, {
                ...desc,
                configurable: true
            })
        }
    }

    return ctx
}

/**
 * Format a REPL evaluation value into a safe string when IPC serialization
 * fails (for example circular objects like `process`, `global`, or
 * `require.cache`, or `BigInt` values).
 */
export function formatReplResult (value: unknown): string {
    return util.inspect(value, { depth: 2 })
}

export default class WDIORepl {
    static introMessage = INTRO_MESSAGE
    static createContext = createReplContext
    static formatResult = formatReplResult
    private _config: ReplConfig
    private _isCommandRunning = false
    private _replServer: repl.REPLServer | undefined

    constructor(config?: Partial<ReplConfig>) {
        this._config = Object.assign(
            {},
            DEFAULT_CONFIG,
            { eval: this.eval.bind(this) },
            config
        )
    }

    eval (cmd: string, context: vm.Context, filename: string | undefined, callback: ReplCallback) {
        if (this._isCommandRunning) {
            return
        }

        if (cmd && STATIC_RETURNS[cmd.trim()]) {
            return callback(null, STATIC_RETURNS[cmd.trim()])
        }

        if (typeof vm.isContext !== 'function' || !vm.isContext(context)) {
            vm.createContext(context)
        }
        this._isCommandRunning = true

        return this._runCmd(cmd, context, filename, callback)
    }

    private _resolveEvalFilename (filename: string | undefined) {
        if (filename && (path.isAbsolute(filename) || filename.startsWith('file:'))) {
            return filename
        }

        const baseDir = this._config.baseDir || process.cwd()
        return path.join(baseDir, 'repl.js')
    }

    private _runCmd (cmd: string, context: vm.Context, filename: string | undefined, callback: ReplCallback) {
        try {
            const loader = vm.constants?.USE_MAIN_CONTEXT_DEFAULT_LOADER
            const result = loader
                ? vm.runInContext(cmd, context, {
                    filename: this._resolveEvalFilename(filename),
                    importModuleDynamically: loader
                })
                : vm.runInContext(cmd, context)
            return this._handleResult(result, callback)
        } catch (e: unknown) {
            this._isCommandRunning = false
            return callback(e as Error, undefined)
        }
    }

    private _handleResult (result: Promise<unknown>, callback: ReplCallback) {
        if (!result || typeof result.then !== 'function') {
            this._isCommandRunning = false
            return callback(null, result)
        }

        let timeoutCalled = false
        const timeout = setTimeout(
            () => {
                callback(new Error('Command execution timed out'), undefined)
                this._isCommandRunning = false
                timeoutCalled = true
            },
            this._config.commandTimeout
        )

        result.then((res: unknown) => {
            /**
             * don't do anything if timeout was called
             */
            if (timeoutCalled) {
                return
            }
            this._isCommandRunning = false
            clearTimeout(timeout)
            return callback(null, res)
        }, (e: Error) => {
            /**
             * don't do anything if timeout was called
             */
            if (timeoutCalled) {
                return
            }

            this._isCommandRunning = false
            clearTimeout(timeout)
            const errorMessage = e ? e.message : 'Command execution timed out'
            const commandError = new Error(errorMessage)
            delete commandError.stack
            return callback(commandError, undefined)
        })
    }

    start (context?: vm.Context) {
        if (this._replServer) {
            throw new Error('a repl was already initialized')
        }

        if (context) {
            const evalFn = this._config.eval
            this._config.eval = function (cmd, _, filename, callback) {
                return evalFn.call(this, cmd, context, filename, callback)
            }
        }

        this._replServer = repl.start(this._config)

        return new Promise((resolve) => {
            return (this._replServer as repl.REPLServer).on('exit', resolve)
        })
    }
}
