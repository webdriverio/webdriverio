import type { Options, Capabilities } from '@wdio/types'
import type { AttachOptions, Browser, MultiRemoteBrowser } from '../types'

export type RemoteOptions = Options.WebdriverIO & Omit<Options.Testrunner, 'capabilities'>

exports.remote = async function (
    params: RemoteOptions,
    remoteModifier?: Function
): Promise<Browser<'async'>> {
    const { remote } = await import('../index.js')
    return remote(params, remoteModifier)
}

exports.attach = async function (attachOptions: AttachOptions): Promise<Browser<'async'>> {
    const { attach } = await import('../index.js')
    return attach(attachOptions)
}

exports.multiremote = async function (
    params: Capabilities.MultiRemoteCapabilities,
    { automationProtocol }: { automationProtocol?: string } = {}
): Promise<MultiRemoteBrowser<'async'>> {
    const { multiremote } = await import('../index.js')
    return multiremote(params, { automationProtocol })
}
