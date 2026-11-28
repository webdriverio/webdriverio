import type { Rule } from 'eslint'

type CallExpression = Parameters<NonNullable<Rule.NodeListener['CallExpression']>>[0]

/**
 * Returns the name of the instance (e.g. `browser` or `driver`) when the call
 * is `<instance>.<command>()` and the instance is in the given list.
 */
export const getCommandInstance = function(
    expression: CallExpression,
    command: 'pause' | 'debug',
    instances: string[] = ['browser', 'driver']
): string | undefined {
    const callee = expression?.callee
    if (
        callee &&
        'object' in callee &&
        'name' in callee.object &&
        instances.includes(callee.object.name) &&
        'property' in callee &&
        'name' in callee.property &&
        callee.property.name === command
    ) {
        return callee.object.name
    }
    return undefined
}
