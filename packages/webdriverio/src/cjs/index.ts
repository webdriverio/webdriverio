import type { Options, Capabilities } from '@wdio/types'
import type * as WebDriverTypes from 'webdriver'
import type { AttachOptions } from '../types.js'

exports.SevereServiceError = class SevereServiceError extends Error {
    constructor(message = 'Severe Service Error occurred.') {
        super(message)
        this.name = 'SevereServiceError'
    }
}

exports.Key = {
    Ctrl: 'WDIO_CONTROL',
    NULL: '\uE000',
    Cancel: '\uE001',
    Help: '\uE002',
    Backspace: '\uE003',
    Tab: '\uE004',
    Clear: '\uE005',
    Return: '\uE006',
    Enter: '\uE007',
    Shift: '\uE008',
    Control: '\uE009',
    Alt: '\uE00A',
    Pause: '\uE00B',
    Escape: '\uE00C',
    Space: '\uE00D',
    PageUp: '\uE00E',
    PageDown: '\uE00F',
    End: '\uE010',
    Home: '\uE011',
    ArrowLeft: '\uE012',
    ArrowUp: '\uE013',
    ArrowRight: '\uE014',
    ArrowDown: '\uE015',
    Insert: '\uE016',
    Delete: '\uE017',
    Semicolon: '\uE018',
    Equals: '\uE019',
    Numpad0: '\uE01A',
    Numpad1: '\uE01B',
    Numpad2: '\uE01C',
    Numpad3: '\uE01D',
    Numpad4: '\uE01E',
    Numpad5: '\uE01F',
    Numpad6: '\uE020',
    Numpad7: '\uE021',
    Numpad8: '\uE022',
    Numpad9: '\uE023',
    Multiply: '\uE024',
    Add: '\uE025',
    Separator: '\uE026',
    Subtract: '\uE027',
    Decimal: '\uE028',
    Divide: '\uE029',
    F1: '\uE031',
    F2: '\uE032',
    F3: '\uE033',
    F4: '\uE034',
    F5: '\uE035',
    F6: '\uE036',
    F7: '\uE037',
    F8: '\uE038',
    F9: '\uE039',
    F10: '\uE03A',
    F11: '\uE03B',
    F12: '\uE03C',
    Command: '\uE03D',
    ZenkakuHankaku: '\uE040'
}

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
exports.remote = async function(
    params: RemoteOptions,
    remoteModifier?: (client: WebDriverTypes.Client, options: Options.WebdriverIO) => WebDriverTypes.Client
): Promise<WebdriverIO.Browser> {
    const { remote } = await import('../index.js')
    return remote(params, remoteModifier)
}

exports.attach = async function(attachOptions: AttachOptions): Promise<WebdriverIO.Browser> {
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
exports.multiremote = async function(
    params: Capabilities.MultiRemoteCapabilities,
    { automationProtocol }: { automationProtocol?: string } = {}
): Promise<WebdriverIO.MultiRemoteBrowser> {
    const { multiremote } = await import('../index.js')
    return multiremote(params, { automationProtocol })
}
