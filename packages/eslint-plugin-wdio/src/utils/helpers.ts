export const isCommand = function(expression: any, command: 'pause' | 'debug'): boolean {
    const callee = expression?.callee

    return (
        callee &&
        callee?.object?.name === 'browser' &&
        callee?.property?.name === command
    )
}

