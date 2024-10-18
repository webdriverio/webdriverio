export const isCommand = function(expression: any, command: 'pause' | 'debug', instances: string[] = ['browser']): boolean {
    const callee = expression?.callee

    return (
        callee &&
        instances.some(instance =>
            // Checking for other possible browser instances as member (customizable)
            ((callee?.object?.name === instance || callee?.object?.property?.name === instance) && callee?.property?.name === command)
        )
    )
}

