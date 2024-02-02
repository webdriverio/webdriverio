import type * as Capabilities from './Capabilities.js'
import type * as Clients from './Clients.js'
import type * as Options from './Options.js'
import type * as Services from './Services.js'
import type * as Reporters from './Reporters.js'
import type * as Frameworks from './Frameworks.js'
import type * as Workers from './Workers.js'

/**
 * exported constant values
 */
export { MESSAGE_TYPES } from './Workers.js'

export type { Capabilities, Clients, Options, Services, Frameworks, Reporters, Workers }

export type JsonPrimitive = string | number | boolean | null
export type JsonObject = { [x: string]: JsonPrimitive | JsonObject | JsonArray }
export type JsonArray = Array<JsonPrimitive | JsonObject | JsonArray>
export type JsonCompatible = JsonObject | JsonArray

export type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T]
export type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>
export type ThenArg<T> = T extends PromiseLike<infer U> ? U : T

interface DriverOptions {
    /**
     * directory where browser and driver should be stored
     */
    cacheDir?: string
    /**
     * path to custom driver binary
     */
    binary?: string
    /**
    * path to the log file
    */
    logPath?: string
}

declare global {
    namespace WebdriverIO {
        interface MochaOpts { [key: string]: any }
        interface JasmineOpts { [key: string]: any }
        interface CucumberOpts { [key: string]: any }
        interface ServiceOption extends Services.ServiceOption {}
        interface ReporterOption extends Reporters.Options {}
        interface Config extends Options.Testrunner {}
        interface HookFunctionExtension {}
        interface WDIODevtoolsOptions {}
        interface WDIOVSCodeServiceOptions {}
        interface BrowserRunnerOptions {}
        interface ChromedriverOptions extends DriverOptions {}
        interface GeckodriverOptions extends DriverOptions {}
        interface EdgedriverOptions extends DriverOptions {}
        interface SafaridriverOptions {}
    }
}
