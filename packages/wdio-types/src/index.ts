import type * as Capabilities from './Capabilities'
import type * as Clients from './Clients'
import type * as Options from './Options'
import type * as Services from './Services'
import type * as Reporters from './Reporters'
import type * as Frameworks from './Frameworks'

export type { Capabilities, Clients, Options, Services, Frameworks, Reporters }

export type JsonPrimitive = string | number | boolean | null
export type JsonObject = { [x: string]: JsonPrimitive | JsonObject | JsonArray }
export type JsonArray = Array<JsonPrimitive | JsonObject | JsonArray>
export type JsonCompatible = JsonObject | JsonArray

export type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T]
export type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>

declare global {
    namespace WebdriverIO {
        interface MochaOpts { [key: string]: any }
        interface JasmineOpts { [key: string]: any }
        interface CucumberOpts { [key: string]: any }
        interface ServiceOption extends Services.ServiceOption {}
        interface ReporterOption extends Reporters.Options {}
        interface Config extends Options.Testrunner {}
        interface HookFunctionExtension {}
    }

    namespace WebDriver {
        type Capabilities = Capabilities.Capabilities
        type DesiredCapabilities = Capabilities.DesiredCapabilities
    }
}
