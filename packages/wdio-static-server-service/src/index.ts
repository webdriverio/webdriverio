/* istanbul ignore file */

import StaticServerLauncher from './launcher'
import { StaticServerOptions } from './types'

export default class StaticServerService { }
export const launcher = StaticServerLauncher
export * from './types'

declare global {
    namespace WebdriverIO {
        interface ServiceOption extends StaticServerOptions {}
    }
}
