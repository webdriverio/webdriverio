import { runUserCommand } from '@wdio/utils'

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
    // not wrapped as a command, see `ACTION_COMMANDS` in `@wdio/utils`
    const types = payload.map((source) => source.actions.map((action) => action.type))
    return runUserCommand(this, 'actions', [types], () => performAll(this, payload))
}

async function performAll (
    scope: WebdriverIO.Browser | WebdriverIO.BrowsingContext,
    payload: ReturnType<KeyAction['toJSON']>[]
) {
    if (isBrowsingContext(scope)) {
        await scope.browser.inputPerformActions({
            context: scope.contextId,
            actions: toBidiActions(payload)
        })
        await scope.browser.inputReleaseActions({ context: scope.contextId })
        return
    }
    const parallelContext = getParallelContextStore().getStore()
    if (parallelContext) {
        await scope.inputPerformActions({
            context: parallelContext,
            actions: toBidiActions(payload)
        })
        await scope.inputReleaseActions({ context: parallelContext })
        return
    }
    await scope.performActions(payload)
    await scope.releaseActions()
}
