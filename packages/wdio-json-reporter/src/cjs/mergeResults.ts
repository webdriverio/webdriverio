module.exports = async function (...args: any[]) {
    const mergeResults = (await import('../mergeResults.js')).default
    return mergeResults(...args)
}
