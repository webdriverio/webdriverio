import type { Capabilities, Options, Services } from '@wdio/types'
import type { Browser } from '@wdio/types/build/Clients'

type TestCustomServiceOptions = {
    // your options here
  }

export default class TestCustomService implements Services.ServiceInstance {
    private _options: TestCustomServiceOptions
    private _capabilities: Capabilities.RemoteCapability
    private _config: Omit<Options.Testrunner, 'capabilities'>
    private _browser: Browser

    constructor(
        serviceOptions: TestCustomServiceOptions,
        capabilities: Capabilities.RemoteCapability,
        config: Omit<Options.Testrunner, 'capabilities'>
    ) {
        this._options = serviceOptions
        this._capabilities = capabilities
        this._config = config
        console.log('MyService constructor', serviceOptions)
    }

    async before(browser: Browser) {
        this._browser = browser
        console.log('MyService before')
    }

    async onPrepare() {
        console.log('MyService onPrepare')
        return
    }

    onComplete() {
        console.log('MyService onComplete')
    }
}
