import { toBidiActions } from '../../utils/actions/base.js'
import type { KeyAction, PointerAction, WheelAction } from '../../utils/actions/index.js'

import { isBrowsingContext } from '../../session/browsingContext.js'
import { getParallelContextStore } from '../../session/context.js'

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
        await this.browser.inputPerformActions({
            context: this.contextId,
            actions: toBidiActions(payload)
        })
        await this.browser.inputReleaseActions({ context: this.contextId })
        return
    }
    const parallelContext = getParallelContextStore().getStore()
    if (parallelContext) {
        await this.inputPerformActions({
            context: parallelContext,
            actions: toBidiActions(payload)
        })
        await this.inputReleaseActions({ context: parallelContext })
        return
    }
    await this.performActions(payload)
    await this.releaseActions()
}
