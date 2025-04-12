import { setGlobalDispatcher, ProxyAgent } from 'undici'
import { defineConfig } from '@wdio/config'

const dispatcher = new ProxyAgent({ uri: new URL(process.env.https_proxy).toString() })
setGlobalDispatcher(dispatcher)

export const config = defineConfig({
    // ...
})