import { ELEMENT_KEY } from 'webdriver'
import type { remote } from 'webdriver'

import type { KeyAction, PointerAction, WheelAction } from '../../utils/actions/index.js'

import { isBrowsingContext } from '../../session/browsingContext.js'

/**
 * Allows to run multiple action interactions at once, e.g. to simulate a pinch zoom or hold a modifier key while
 * clicking. Build each action chain with [`browser.action()`](/docs/api/browser/action), then pass the chains to this
 * command.
 *
 * <example>
    :action.js
    it('run multiple actions at once for a pinch zoom', async () => {
        await browser.actions([
            browser.action('pointer')
                .move(500, 500)
                .down()
                .move(250, 250)
                .up(),
            browser.action('pointer')
                .move(500, 500)
                .down()
                .move(750, 750)
                .up()
        ])
    });
 * </example>
 *
 * @alias browser.action
 * @type utility
 *
 */
export async function actions (
    this: WebdriverIO.Browser | WebdriverIO.BrowsingContext,
    actions: (KeyAction | PointerAction | WheelAction)[],
): Promise<void> {
    const payload = actions.map((action) => action.toJSON())
    if (isBrowsingContext(this)) {
        const bidiPayload = payload.map((source) => ({
            ...source,
            actions: source.actions.map((action) => {
                const origin = (action as { origin?: { [key: string]: string } }).origin
                if (!origin || typeof origin !== 'object' || !(ELEMENT_KEY in origin)) {
                    return action
                }
                return {
                    ...action,
                    origin: {
                        type: 'element',
                        element: { sharedId: origin[ELEMENT_KEY] }
                    }
                }
            })
        }))
        await this.browser.inputPerformActions({
            context: this.contextId,
            actions: bidiPayload as remote.InputSourceActions[]
        })
        await this.browser.inputReleaseActions({ context: this.contextId })
        return
    }
    await this.performActions(payload)
    await this.releaseActions()
}
