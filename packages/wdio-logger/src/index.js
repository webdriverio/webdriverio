/**
 * environment check to allow to use this package in a web context
 */
export default (typeof process !== 'undefined' && typeof process.release !== 'undefined' && process.release.name === 'node')
    ? require('./node').default
    : require('./web').default
