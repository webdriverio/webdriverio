import type { Rule } from 'eslint'

type CallExpression = Parameters<NonNullable<Rule.NodeListener['CallExpression']>>[0]

export const isCommand = function(
    expression: CallExpression,
    command: 'pause' | 'debug',
    instances: string[] = ['browser']
): boolean {
    const callee = expression?.callee
    return (
        callee &&
        'object' in callee &&
        'name' in callee.object &&
        instances.includes(callee.object?.name) &&
        'property' in callee &&
        'name' in callee.property &&
        callee.property?.name === command
    )
}

