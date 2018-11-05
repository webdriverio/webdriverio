/**
 * environment check to allow to use this package in a web context
 */
export default (typeof process !== 'undefined' && process.release.name === 'node')
    ? require('./node')
    : require('./web')
