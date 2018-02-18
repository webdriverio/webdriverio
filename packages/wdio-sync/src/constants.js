export const STACKTRACE_FILTER = /((wdio-sync\/)*(build\/index.js|node_modules\/fibers)|- - - - -)/g
export const STACKTRACE_FILTER_FN = (e) => !e.match(STACKTRACE_FILTER)
