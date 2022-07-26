import type { Options, Capabilities } from '@wdio/types'
import type { AttachOptions } from '../types'

export type RemoteOptions = Options.WebdriverIO & Omit<Options.Testrunner, 'capabilities'>

exports.remote = async function (
    params: RemoteOptions,
    remoteModifier?: Function
): Promise<WebdriverIO.Browser> {
    const { remote } = await import('../index.js')
    return remote(params, remoteModifier)
}

exports.attach = async function (attachOptions: AttachOptions): Promise<WebdriverIO.Browser> {
    const { attach } = await import('../index.js')
    return attach(attachOptions)
}

exports.multiremote = async function (
    params: Capabilities.MultiRemoteCapabilities,
    { automationProtocol }: { automationProtocol?: string } = {}
): Promise<WebdriverIO.MultiRemoteBrowser> {
    const { multiremote } = await import('../index.js')
    return multiremote(params, { automationProtocol })
}
