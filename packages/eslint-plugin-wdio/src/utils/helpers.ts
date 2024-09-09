export const isCommand = function(expression: any, command: 'pause' | 'debug', instances: string[] = ['browser']): boolean {
    const callee = expression?.callee

    return (
        callee &&
        instances.some(instance =>
            // Checking for all configured possible browser instances
            (callee?.object?.name === instance && callee?.property?.name === command) ||
            (callee?.object?.type === 'ThisExpression' && callee?.property?.name === instance &&
                expression?.parent?.property?.name === command)
        )
    )
}

