export const isCommand = function(expression: { callee: { object: { name?: string }, property?: { name: string } } }, command: 'pause' | 'debug'): boolean {
    const callee = expression?.callee

    return (
        callee &&
        callee?.object?.name === 'browser' &&
        callee?.property?.name === command
    )
}

