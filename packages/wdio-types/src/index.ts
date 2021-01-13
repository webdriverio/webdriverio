import type * as Capabilities from './Capabilities'
import type * as Clients from './Clients'
import type * as Options from './Options'
import type * as Services from './Services'
import type * as Frameworks from './Frameworks'

export type { Capabilities, Clients, Options, Services, Frameworks }

export type JsonPrimitive = string | number | boolean | null
export type JsonObject = { [x: string]: JsonPrimitive | JsonObject | JsonArray }
export type JsonArray = Array<JsonPrimitive | JsonObject | JsonArray>
export type JsonCompatible = JsonObject | JsonArray

declare global {
    namespace WebdriverIO {
        export type Config = Options.Testrunner
    }

    namespace WebDriver {
        export type Capabilities = Capabilities.Capabilities
        export type DesiredCapabilities = Capabilities.DesiredCapabilities
    }
}
