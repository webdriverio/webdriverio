import type { Options, Capabilities } from '@wdio/types'
import type * as WebDriverTypes from 'webdriver'
import type { AttachOptions } from '../types.js'

export type RemoteOptions = Options.WebdriverIO & Omit<Options.Testrunner, 'capabilities' | 'rootDir'>

/**
 * A method to create a new session with WebdriverIO.
 *
 * <b>
 * NOTE: If you hit "error TS2694: Namespace 'global.WebdriverIO' has no exported member 'Browser'" when using typescript,
 * add "@wdio/globals/types" into tsconfig.json's "types" array will solve it: <code> { "compilerOptions": { "types": ["@wdio/globals/types"] } } </code>
 * </b>
 *
 * @param params Options to create the session with
 * @param remoteModifier Modifier function to change the monad object
 * @return browser object with sessionId
 * @see <a href="https://webdriver.io/docs/typescript">Typescript setup</a>
 */
export const remote = async function(
    params: RemoteOptions,
    remoteModifier?: (client: WebDriverTypes.Client, options: Options.WebdriverIO) => WebDriverTypes.Client
): Promise<WebdriverIO.Browser> {
    const { remote } = await import('../index.js')
    return remote(params, remoteModifier)
}

export const attach = async function(attachOptions: AttachOptions): Promise<WebdriverIO.Browser> {
    const { attach } = await import('../index.js')
    return attach(attachOptions)
}

/**
 * WebdriverIO allows you to run multiple automated sessions in a single test.
 * This is handy when you're testing features that require multiple users (for example, chat or WebRTC applications).
 *
 * Instead of creating a couple of remote instances where you need to execute common commands like newSession() or url() on each instance,
 * you can simply create a multiremote instance and control all browsers at the same time.
 *
 * <b>
 * NOTE: Multiremote is not meant to execute all your tests in parallel.
 * It is intended to help coordinate multiple browsers and/or mobile devices for special integration tests (e.g. chat applications).
 * </b>
 *
 * @param params capabilities to choose desired devices.
 * @param automationProtocol
 * @return All remote instances, the first result represents the capability defined first in the capability object,
 * the second result the second capability and so on.
 *
 * @see <a href="https://webdriver.io/docs/multiremote">External document and example usage</a>.
 */
export const multiremote = async function(
    params: Capabilities.MultiRemoteCapabilities,
    { automationProtocol }: { automationProtocol?: string } = {}
): Promise<WebdriverIO.MultiRemoteBrowser> {
    const { multiremote } = await import('../index.js')
    return multiremote(params, { automationProtocol })
}
