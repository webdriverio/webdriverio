import type { SafaridriverOptions as SafaridriverParameters } from 'safaridriver'
import type { GeckodriverParameters } from 'geckodriver'
import type { InstallOptions } from '@puppeteer/browsers'
import type { EdgedriverParameters } from 'edgedriver'

/**
 * types only: the main entry exports them, so a config that loads `webdriverio` sees every driver option
 */
export type ChromedriverParameters = (
    Partial<InstallOptions> &
    Omit<EdgedriverParameters, 'port' | 'edgeDriverVersion' | 'customEdgeDriverPath'> &
    Pick<GeckodriverParameters, 'spawnOpts'>
)
declare global {
    namespace WebdriverIO {
        interface ChromedriverOptions extends ChromedriverParameters { }
        interface GeckodriverOptions extends Omit<GeckodriverParameters, 'port'> { }
        interface EdgedriverOptions extends Omit<EdgedriverParameters, 'port'> { }
        interface SafaridriverOptions extends Omit<SafaridriverParameters, 'port'> { }
    }
}
