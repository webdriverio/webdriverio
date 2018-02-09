export const SYNC_COMMANDS = ['domain', '_events', '_maxListeners', 'setMaxListeners', 'emit',
    'addListener', 'on', 'once', 'removeListener', 'removeAllListeners', 'listeners',
    'getMaxListeners', 'listenerCount', 'getPrototype']

export const STACKTRACE_FILTER = /((wdio-sync\/)*(build\/index.js|node_modules\/fibers)|- - - - -)/g
export const STACKTRACE_FILTER_FN = (e) => !e.match(STACKTRACE_FILTER)
