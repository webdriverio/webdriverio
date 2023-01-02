/* istanbul ignore file */

import StaticServerLauncher from './launcher.js'
import type { StaticServerOptions } from './types.js'

export default class StaticServerService { }
export const launcher = StaticServerLauncher
export * from './types.js'

declare global {
    namespace WebdriverIO {
        interface ServiceOption extends StaticServerOptions {}
    }
}
