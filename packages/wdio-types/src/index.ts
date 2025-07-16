/* eslint-disable @typescript-eslint/no-explicit-any */
import type * as Automation from './Automation.js'
import type * as Capabilities from './Capabilities.js'
import type * as Options from './Options.js'
import type * as Services from './Services.js'
import type * as Reporters from './Reporters.js'
import type * as Frameworks from './Frameworks.js'
import type * as Workers from './Workers.js'
import type * as Network from './Network.js'

export type { Event, TestState, LogMessage, WDIOErrorEvent, BrowserData } from './Runner.js'
export { IPC_MESSAGE_TYPES, type IPCMessage, type AnyIPCMessage, type IPCMessageValue } from './ipc/messages.js'
export { WS_MESSAGE_TYPES, type WSMessage, type AnyWSMessage, type WSMessageValue } from './ws/messages.js'
export type { Automation, Capabilities, Options, Services, Frameworks, Reporters, Workers }

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
        /**
         * Service option to be extended by ecosystem services
         */
        interface ServiceOption extends Services.ServiceOption {}
        /**
         * Reporter option to be extended by ecosystem reporters
         */
        interface ReporterOption extends Reporters.Options {}

        /**
         * types to be extended by `webdriverio` package
         */
        interface Browser {
            requestedCapabilities?: any
        }
        interface MultiRemoteBrowser {}
        interface Element {
            /**
             * parent of the element if fetched via `$(parent).$(child)`
             */
            parent: WebdriverIO.Element | WebdriverIO.Browser
        }
        interface MultiRemoteElement {}
        interface ElementArray {}

        /**
         * A network request during a WebDriver Bidi session
         */
        interface Request extends Network.Request {}

        /**
         * types to be extended by ecosystem framework adapters
         */
        interface SharedFrameworkOpts { [key: string]: any }
        interface MochaOpts extends SharedFrameworkOpts {}
        interface JasmineOpts extends SharedFrameworkOpts {}
        interface CucumberOpts extends SharedFrameworkOpts {}
        interface Config extends Options.Testrunner, Capabilities.WithRequestedTestrunnerCapabilities {}
        interface RemoteConfig extends Options.WebdriverIO, Capabilities.WithRequestedCapabilities {}
        interface MultiremoteConfig extends Options.Testrunner, Capabilities.WithRequestedMultiremoteCapabilities {}
        interface HookFunctionExtension {}
        interface WDIOVSCodeServiceOptions {}
        interface BrowserRunnerOptions {}
        interface ChromedriverOptions extends DriverOptions {}
        interface GeckodriverOptions extends DriverOptions {}
        interface EdgedriverOptions extends DriverOptions {}
        interface SafaridriverOptions {}
    }
}
