import type { CommandTiming } from '../types.js'

/**
 * Finds the most recent user command that hasn't been matched with an internal command yet.
 */
export function findMostRecentUnmatchedUserCommand(
    commandTimings: Map<string, CommandTiming>
): [string, CommandTiming] | undefined {
    return Array.from(commandTimings.entries())
        .filter(([_id, timing]) => timing.isUserCommand && !timing.selectorType)
        .sort(([_idA, a], [_idB, b]) => b.startTime - a.startTime)[0]
}

/**
 * Finds the matching internal command timing entry for a given formatted selector and selector type.
 */
export function findMatchingInternalCommandTiming(
    commandTimings: Map<string, CommandTiming>,
    formattedSelector: string,
    selectorType: string
): [string, CommandTiming] | undefined {
    return Array.from(commandTimings.entries())
        .filter(([_id, timing]) =>
            !timing.isUserCommand &&
            timing.formattedSelector === formattedSelector &&
            timing.selectorType === selectorType
        )
        .sort(([_idA, a], [_idB, b]) => b.startTime - a.startTime)[0]
}
