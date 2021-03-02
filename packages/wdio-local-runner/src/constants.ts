export const SHUTDOWN_TIMEOUT = 5000

export const DEBUGGER_MESSAGES = [
    'Debugger listening on',
    'Debugger attached',
    'Waiting for the debugger'
]

export const BUFFER_OPTIONS = {
    initialSize: (1000 * 1024),   // start at 100 kilobytes.
    incrementAmount: (100 * 1024) // grow by 10 kilobytes each time buffer overflows.
}
