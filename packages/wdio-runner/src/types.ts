import type { Capabilities, Services } from '@wdio/types'
import type { getConfig, matchers } from 'expect-webdriverio'

import type BaseReporter from './reporter.js'

export type BeforeArgs = Parameters<Required<Services.HookFunctions>['before']>
export type AfterArgs = Parameters<Required<Services.HookFunctions>['after']>
export type BeforeSessionArgs = Parameters<Required<Services.HookFunctions>['beforeSession']>
export type AfterSessionArgs = Parameters<Required<Services.HookFunctions>['afterSession']>

interface Args extends Partial<WebdriverIO.Config> {
    ignoredWorkerServices?: string[]
    watch?: boolean
}

export type RunParams = {
    cid: string
    args: Args
    specs: string[]
    caps: Capabilities.RequestedStandaloneCapabilities | Capabilities.RequestedMultiremoteCapabilities
    configFile: string
    retries: number
}

export interface TestFramework {
    init: (
        cid: string,
        config: WebdriverIO.Config,
        specs: string[],
        capabilities: Capabilities.RequestedStandaloneCapabilities | Capabilities.RequestedMultiremoteCapabilities,
        reporter: BaseReporter
    ) => TestFramework
    run (): Promise<number>
    hasTests (): boolean
    setupExpect?: (
        wdioExpect: ExpectWebdriverIO.Expect,
        wdioMatchers: typeof matchers,
        getExpectConfig: typeof getConfig
    ) => void
}
